import { defineCollection, z } from 'astro:content';

const profileCollection = defineCollection({
  type: 'data',
  schema: z.object({
    name: z.string(),
    title: z.string(),
    affiliation: z.string(),
    advisor: z.string(),
    email: z.string(),
    phone: z.string().optional(),
    address: z.string(),
    bio: z.string(),
    researchKeywords: z.array(z.string()),
    links: z.record(z.string()),
    photo: z.string().optional(),
  }),
});

const publicationCollection = defineCollection({
  type: 'data',
  schema: z.object({
    publications: z.array(z.object({
      title: z.string(),
      authors: z.array(z.string()),
      venue: z.string(),
      year: z.number(),
      doi: z.string().optional(),
      url: z.string().optional(),
      keywords: z.array(z.string()),
    })),
  }),
});

const talkCollection = defineCollection({
  type: 'data',
  schema: z.object({
    talks: z.array(z.object({
      title: z.string(),
      event: z.string(),
      location: z.string(),
      date: z.string(),
      url: z.string().optional(),
    })),
  }),
});

const teachingCollection = defineCollection({
  type: 'data',
  schema: z.object({
    teaching: z.array(z.object({
      course: z.string(),
      institution: z.string(),
      year: z.number(),
      level: z.string(),
      url: z.string().optional(),
    })),
  }),
});

export const collections = {
  profile: profileCollection,
  publications: publicationCollection,
  talks: talkCollection,
  teaching: teachingCollection,
};