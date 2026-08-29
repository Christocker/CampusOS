import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function debug() {
  // Get Chris
  const chris = await prisma.user.findUnique({ 
    where: { email: 'chrisengada2006@gmail.com' },
    select: { id: true, name: true, email: true }
  });
  
  if (!chris) {
    console.log("Chris not found!");
    return;
  }

  // Get enrollments
  const enrollments = await prisma.userEnrollment.findMany({
    where: { userId: chris.id },
    select: { subjectId: true }
  });
  const subjectIds = enrollments.map(e => e.subjectId);

  // Get tasks in enrolled subjects
  const tasks = subjectIds.length > 0
    ? await prisma.task.findMany({
        where: { subjectId: { in: subjectIds } },
        select: { id: true, title: true, subjectId: true }
      })
    : [];

  // Get completions
  const completions = await prisma.taskCompletion.findMany({
    where: { userId: chris.id },
    select: { taskId: true, completed: true }
  });

  console.log(`User: ${chris.name} (${chris.email})`);
  console.log(`Enrolled in ${enrollments.length} subjects`);
  console.log(`${tasks.length} tasks visible`);
  console.log(`${completions.length} completions recorded`);
  
  // Check if enrolledIds are correct
  const enrolledIds = subjectIds;
  console.log(`Enrolled IDs: ${JSON.stringify(enrolledIds.slice(0, 3))}...`);
}

debug().catch(console.error).finally(() => prisma.$disconnect());
