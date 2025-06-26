import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create test users
  const user1 = await prisma.user.upsert({
    where: { email: 'alice@example.com' },
    update: {},
    create: {
      email: 'alice@example.com',
      name: 'Alice Johnson',
      profile: {
        create: {
          bio: 'Full-stack developer passionate about web performance',
          avatar: 'https://avatars.githubusercontent.com/u/1?v=4',
        },
      },
    },
  });

  const user2 = await prisma.user.upsert({
    where: { email: 'bob@example.com' },
    update: {},
    create: {
      email: 'bob@example.com',
      name: 'Bob Smith',
      profile: {
        create: {
          bio: 'UI/UX designer and front-end developer',
          avatar: 'https://avatars.githubusercontent.com/u/2?v=4',
        },
      },
    },
  });

  // Create tags
  const tags = await Promise.all([
    prisma.tag.upsert({
      where: { name: 'qwik' },
      update: {},
      create: { name: 'qwik' },
    }),
    prisma.tag.upsert({
      where: { name: 'web-components' },
      update: {},
      create: { name: 'web-components' },
    }),
    prisma.tag.upsert({
      where: { name: 'performance' },
      update: {},
      create: { name: 'performance' },
    }),
  ]);

  // Create posts
  await prisma.post.create({
    data: {
      title: 'Getting Started with Qwik',
      content: 'Qwik is a revolutionary framework that introduces resumability...',
      published: true,
      authorId: user1.id,
      tags: {
        connect: [{ id: tags[0].id }, { id: tags[2].id }],
      },
    },
  });

  await prisma.post.create({
    data: {
      title: 'Building Design Systems with LIT',
      content: 'LIT makes it easy to create fast, lightweight web components...',
      published: true,
      authorId: user2.id,
      tags: {
        connect: [{ id: tags[1].id }],
      },
    },
  });

  console.log('✅ Database seeded successfully!');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ Error seeding database:', e);
    await prisma.$disconnect();
    process.exit(1);
  });