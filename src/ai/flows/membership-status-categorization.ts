
'use server';
/**
 * @fileOverview Provides an AI-generated natural language summary of student membership statuses.
 *
 * - aiMembershipStatusOverview - A function that generates a summary of student membership health.
 * - StudentMembershipStatusInput - The input type for the aiMembershipStatusOverview function.
 * - MembershipSummaryOutput - The return type for the aiMembershipStatusOverview function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const StudentMembershipStatusInputSchema = z.object({
  students: z.array(
    z.object({
      id: z.string().describe('Unique identifier for the student.'),
      name: z.string().describe('The name of the student.'),
      membershipStartDate: z
        .string()
        .describe('The start date of the student\'s membership in YYYY-MM-DD format.'),
      membershipExpiryDate: z
        .string()
        .describe('The expiry date of the student\'s membership in YYYY-MM-DD format.'),
    })
  ),
});
export type StudentMembershipStatusInput = z.infer<typeof StudentMembershipStatusInputSchema>;

const MembershipSummaryOutputSchema = z.object({
  summary: z.string().describe('A natural language summary categorizing student memberships.'),
});
export type MembershipSummaryOutput = z.infer<typeof MembershipSummaryOutputSchema>;

// Internal schema for the prompt, including calculated fields
const _PromptInputSchema = z.object({
  currentDate: z.string().describe('Current date in YYYY-MM-DD format.'),
  students: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      membershipStartDate: z.string(),
      membershipExpiryDate: z.string(),
      remainingDays: z
        .number()
        .describe('Number of days until membership expires. Negative if already expired.'),
      isExpired: z.boolean().describe('True if membership has expired, false otherwise.'),
    })
  ),
});

const membershipStatusCategorizationPrompt = ai.definePrompt({
  name: 'membershipStatusCategorizationPrompt',
  input: { schema: _PromptInputSchema },
  output: { schema: MembershipSummaryOutputSchema },
  prompt: `You are an AI assistant for a library management system. Your task is to provide a concise natural language summary of the current membership status of students. Do not provide any conversational preamble. Focus only on the summary.

Categorize students into the following groups based on 'remainingDays':
- 'Active': remainingDays > 30
- 'Expiring Soon': 0 <= remainingDays <= 30
- 'Recently Expired': -30 <= remainingDays < 0
- 'Long Expired': remainingDays < -30

Highlight any students who are 'Expiring Soon' or 'Recently Expired' as these require immediate attention. Also, provide overall counts for each category. 

Current Date: {{{currentDate}}}

Students:
{{#each students}}
- Name: {{{name}}}, Expiry Date: {{{membershipExpiryDate}}}, Remaining Days: {{{remainingDays}}}, Is Expired: {{{isExpired}}}
{{/each}}

Provide the summary in a paragraph, highlighting students requiring immediate attention.
`,
});

const membershipStatusCategorizationFlow = ai.defineFlow(
  {
    name: 'membershipStatusCategorizationFlow',
    inputSchema: StudentMembershipStatusInputSchema,
    outputSchema: MembershipSummaryOutputSchema,
  },
  async (input) => {
    const now = new Date();
    now.setHours(0, 0, 0, 0); // Normalize to start of day for accurate day calculation
    const currentDateString = now.toISOString().split('T')[0];

    const studentsWithStatus = input.students.map((student) => {
      // Map Firestore fields if the input ones are missing
      const startDate = student.membershipStartDate || (student as any).joinDate || currentDateString;
      const expiryDateStr = student.membershipExpiryDate || (student as any).expiryDate || currentDateString;

      let expiryDate: Date;
      try {
        expiryDate = new Date(expiryDateStr);
        if (isNaN(expiryDate.getTime())) throw new Error("Invalid date");
      } catch (e) {
        expiryDate = now;
      }
      expiryDate.setHours(0, 0, 0, 0); // Normalize to start of day

      const diffTime = expiryDate.getTime() - now.getTime();
      const remainingDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      const isExpired = remainingDays < 0;

      return {
        ...student,
        membershipStartDate: startDate,
        membershipExpiryDate: expiryDateStr,
        remainingDays,
        isExpired,
      };
    });

    const promptInput = {
      currentDate: currentDateString,
      students: studentsWithStatus,
    };

    const { output } = await membershipStatusCategorizationPrompt(promptInput);
    return output!;
  }
);

export async function aiMembershipStatusOverview(
  input: StudentMembershipStatusInput
): Promise<MembershipSummaryOutput> {
  return membershipStatusCategorizationFlow(input);
}
