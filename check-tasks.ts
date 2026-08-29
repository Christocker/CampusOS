import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function checkChrisTasks() {
  const chris = await prisma.user.findUnique({ 
    where: { email: 'chrisengada2006@gmail.com' },
    select: { id: true, name: true }
  });
  
  if (!chris) {
    console.log("Chris not found!");
    return;
  }
  
  // Tasks created by Chris
  const tasksCreatedByChris = await prisma.task.findMany({
    where: { userId: chris.id },
    select: { id: true, title: true, subjectId: true }
  });
  
  // Tasks in Chris's enrolled subjects
  const enrolledIds = await prisma.userEnrollment.findMany({
    where: { userId: chris.id },
    select: { subjectId: true }
  }).then(e => e.map(x => x.subjectId));
  
  const tasksInEnrolledSubjects = enrolledIds.length > 0
    ? await prisma.task.findMany({
        where: { subjectId: { in: enrolledIds } },
        select: { id: true, title: true, subjectId: true, userId: true }
      })
    : [];
  
  console.log(`Chris created: ${tasksCreatedByChris.length} tasks`);
  console.log(`Chris sees (enrolled subjects): ${tasksInEnrolledSubjects.length} tasks`);
  console.log("Created:", tasksCreatedByChris.map(t => t.title));
  console.log("Sees:", tasksInEnrolledSubjects.map(t => `${t.title} (by ${t.userId})`));
}

checkChrisTasks().catch(console.error).finally(() => prisma.$disconnect());
