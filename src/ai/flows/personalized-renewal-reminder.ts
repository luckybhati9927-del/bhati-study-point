'use server';
/**
 * @fileOverview A Genkit flow for generating personalized renewal reminder messages for students.
 *
 * - personalizedRenewalReminder - A function that generates a renewal reminder message.
 * - PersonalizedRenewalReminderInput - The input type for the personalizedRenewalReminder function.
 * - PersonalizedRenewalReminderOutput - The return type for the personalizedRenewalReminder function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const PersonalizedRenewalReminderInputSchema = z.object({
  studentName: z.string().describe("The student's name."),
  membershipExpiryDate: z
    .string()
    .describe('The date when the membership expires (YYYY-MM-DD).'),
  remainingDays: z
    .number()
    .describe(
      'The number of days remaining until membership expiry. Negative if expired, 0 if expiring today.'
    ),
});
export type PersonalizedRenewalReminderInput = z.infer<
  typeof PersonalizedRenewalReminderInputSchema
>;

const PersonalizedRenewalReminderOutputSchema = z.object({
  message: z.string().describe('The personalized renewal reminder message.'),
});
export type PersonalizedRenewalReminderOutput = z.infer<
  typeof PersonalizedRenewalReminderOutputSchema
>;

export async function personalizedRenewalReminder(
  input: PersonalizedRenewalReminderInput
): Promise<PersonalizedRenewalReminderOutput> {
  return personalizedRenewalReminderFlow(input);
}

const prompt = ai.definePrompt({
  name: 'personalizedRenewalReminderPrompt',
  input: {schema: PersonalizedRenewalReminderInputSchema},
  output: {schema: PersonalizedRenewalReminderOutputSchema},
  prompt: `As an admin of Bhati Study Point, generate a personalized, empathetic, and actionable renewal reminder message for a student.

Student Name: {{{studentName}}}
Membership Expiry Date: {{{membershipExpiryDate}}}
Remaining Days: {{{remainingDays}}}

Consider the following:
- If remainingDays is positive, the membership is nearing expiration.
- If remainingDays is 0, the membership expires today.
- If remainingDays is negative, the membership has already expired.

Craft a message that gently reminds them, emphasizes the benefits of continued access, and clearly states the call to action (renew their membership). Do not include a subject line or salutation other than 'Dear [Student Name]'.

Example if 5 days remaining:
Dear John Doe,
We hope you're enjoying your time at Bhati Study Point. Your membership is set to expire in 5 days, on 2024-12-31. To ensure uninterrupted access to our study facilities and resources, please renew your membership at your earliest convenience. We value your presence in our study community!

Example if expired by 3 days:
Dear Jane Doe,
We noticed that your Bhati Study Point membership expired 3 days ago, on 2024-11-01. We miss having you! To regain access to our premier study environment and all its benefits, please renew your membership today. We look forward to welcoming you back!

Generate the message for:
Dear {{{studentName}}},

{{#if (gt remainingDays 0)}}
We hope you're enjoying your time at Bhati Study Point. Your membership is set to expire in {{{remainingDays}}} day{{#if (gt remainingDays 1)}}s{{/if}}, on {{{membershipExpiryDate}}}. To ensure uninterrupted access to our study facilities and resources, please renew your membership at your earliest convenience. We value your presence in our study community!
{{else if (eq remainingDays 0)}}
We hope you're enjoying your time at Bhati Study Point. Your membership expires today, {{{membershipExpiryDate}}}! To ensure uninterrupted access to our study facilities and resources, please renew your membership now. We value your presence in our study community!
{{else}}
We noticed that your Bhati Study Point membership expired {{multiply remainingDays -1}} day{{#if (gt (multiply remainingDays -1) 1)}}s{{/if}} ago, on {{{membershipExpiryDate}}}. We miss having you! To regain access to our premier study environment and all its benefits, please renew your membership today. We look forward to welcoming you back!
{{/if}}`,
});

const personalizedRenewalReminderFlow = ai.defineFlow(
  {
    name: 'personalizedRenewalReminderFlow',
    inputSchema: PersonalizedRenewalReminderInputSchema,
    outputSchema: PersonalizedRenewalReminderOutputSchema,
  },
  async input => {
    // Helper for Handlebars to multiply numbers (e.g., for absolute value of negative days)
    ai.handlebars.registerHelper('multiply', function (a, b) {
      return a * b;
    });

    const {output} = await prompt(input);
    return output!;
  }
);
