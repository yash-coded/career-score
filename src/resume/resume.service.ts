/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable } from '@nestjs/common';
import { createOpenAI } from '@ai-sdk/openai';
import { generateObject, Message } from 'ai';
import * as fs from 'fs';
import { z } from 'zod';
import { data } from 'src/constants/data';
import * as path from 'path';
import { rubric } from 'rubric';
import { prompts } from 'src/prompts';

const openai = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

@Injectable()
export class ResumeService {
  async handleResume(filePath: string) {
    const file = fs.readFileSync(filePath);
    const fileBuffer = Buffer.from(file);
    const message: Message[] = [
      {
        id: '1',
        content: prompts.resumeReview,
        role: 'user',
      },
      {
        id: '2',
        content: `Here is the job description: ${data.jobPost}`,
        role: 'user',
      },
      {
        id: '3',
        content: 'Here is the resume:',
        role: 'user',
        experimental_attachments: [
          {
            contentType: 'application/pdf',
            url: `data:application/pdf;base64,${fileBuffer.toString('base64')}`,
          },
        ],
      },
      {
        id: '4',
        content: `Here is the rubric: ${JSON.stringify(rubric)}`,
        role: 'user',
      },
    ];

    const response = await generateObject({
      model: openai('gpt-4.1'),
      messages: message,
      schema: z.object({
        name: z.string(),

        assessment: z.object({
          categoryBreakdown: z.array(
            z.object({
              category: z.string(),
              score: z.number(),
            }),
            {
              description:
                'This is the breakdown of the score for each category mentioned in the rubric',
            },
          ),
          reputation: z.array(
            z.object({
              item: z.string(),
              verdict: z.enum(['Strong', 'Medium', 'Weak']),
            }),
            {
              description: `This is the breakdown of the score for the reputation category
                Reputation is the perceived prestige of the company the applicant has worked at.
                Reputation is the education level of the applicant.
              `,
            },
          ),
          leadership: z.array(
            z.object({
              item: z.string(),
              verdict: z.enum(['Strong', 'Medium', 'Weak']),
            }),
            {
              description: `This is the breakdown of the score for the leadership category
                Leadership is the perceived leadership skills of the applicant.
                Leadership is the ability to lead a team to success.
                Leadership is the ability to make tough decisions.
                Leadership is the ability to motivate a team.
                Leadership is the ability to delegate tasks.
                Leadership is the ability to mentor a team.
                Leadership is the ability to communicate effectively.
                Leadership is the ability to lead by example.
              `,
            },
          ),
          softSkills: z.array(
            z.object({
              item: z.string(),
              verdict: z.enum(['Strong', 'Medium', 'Weak']),
            }),
            {
              description: `This is the breakdown of the score for the soft skills category
                Soft skills are the perceived soft skills of the applicant.
                Soft skills are the ability to communicate effectively.
                Soft skills are the ability to lead by example.
                Soft skills are the ability to work in a team.
              `,
            },
          ),
          technicalSkills: z.array(
            z.object({
              item: z.string(),
              verdict: z.enum(['Strong', 'Medium', 'Weak']),
            }),
            {
              description: `This is the breakdown of the score for the technical skills category
                Technical skills are the hard skills of the applicant.
                Technical skills are the ability to code.
                Technical skills are the ability to solve problems.
                Technical skills are the ability to learn new technologies.
                Technical skills are the ability to work in a team.
              `,
            },
          ),
          cultureFit: z.array(
            z.object({
              item: z.string(),
              verdict: z.enum(['Strong', 'Medium', 'Weak']),
            }),
            {
              description: `This is the breakdown of the score for the culture fit category
                Culture fit is the perceived culture fit of the applicant.
                Culture fit is the ability of applicant to fit into the company culture.
              `,
            },
          ),
          actionItems: z.enum(['Improve', 'Keep', 'Highlight']),
          overallScore: z.number(),
          feedback: z.string(),
          longTermActionPlan: z.array(
            z.object({
              actionItem: z.string(),
              reason: z.string(),
            }),
          ),
          shortTermActionPlan: z.array(
            z.object({
              actionItem: z.string(),
              reason: z.string(),
            }),
          ),
        }),
      }),
    });

    return response.object;
  }

  async generateScorecard() {
    const message: Message[] = [
      {
        id: '1',
        content: `
          I want you to generate a scorecard based on the given job description

          Any scorecard will have 3 fixed categories which will always be in a job category:
1. Employee work history prestige (ie on one extreme, Google is top tier, a local startup that has 2 employees and no revenue has none). Watch for people who claim to work for these companies but are joking, for example an uber driver saying they worked at Uber doing logistics technology. Weight this 20%.

2. Education history prestige (ie people who went to Harvard have maximum prestige in this category, but people who no education have minimum prestige in this category). Watch out for people who do free online courses and put this on their resume, prestige should only count for widely recognized programs that have a high barrier to entry / completion. Weight this at 20%.

3. Domain relavnce will amek up 10%. Domain relevance means understanding the problem the job posting is working in. For example, if I worked at Neo Financial, and wanted to get a job at RBC, I would have high domain relevance because we are both in banking and fintech. But, if I worked at Neo doing some arbitrary mapping tool which RBC does not have, it would have slight domain relevance, but not high domain relevance. The extremes are if I was doing something like oil and gas domain and airline software. However, something like oil and gas and emissions tracking software have medium to high domain relevance. This will be worth an additional 20% weight.

The rest of the scorecard will be made up of categories of perceived interest to the recruiter. For example, if the job asks for OOP and mentions multiple languages like Pyhton, Typescript, C++, but the applicant mentions Java experience demonstrating OOP terminology, still give them full points for this experience.

          `,
        role: 'user',
      },
      {
        id: '2',
        content: `Here is the job description: ${data.jobPost}`,
        role: 'user',
      },
    ];

    const response = await generateObject({
      model: openai('gpt-4o-mini'),
      messages: message,
      schema: z.object({
        rubric: z.array(
          z.object({
            skill: z.string(),
            weight: z.number(),
          }),
        ),
      }),
    });

    console.log(
      '🚀 ~ ResumeService ~ handleResume ~ response:',
      response.object,
    );

    // save the response to a file
    fs.writeFileSync(
      path.join(__dirname, 'scorecard.json'),
      JSON.stringify(response.object, null, 2),
    );

    return response;
  }
}
