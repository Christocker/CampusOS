import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function checkChris() {
  // Find Chris by email
  const chris = await prisma.user.findUnique({ 
    where: { email: 'chrisengada2006@gmail.com' },
    select: { id: true, name: true, email: true }
  });
  console.log("Chris user:", chris);

  if (!chris) {
    console.log("ERROR: Chris not found in DB!");
    return;
  }

  // Check enrollments
  const enrollments = await prisma.userEnrollment.findMany({
    where: { userId: chris.id },
    select: { subjectId: true }
  });
  console.log("Chris enrollments count:", enrollments.length);

  // Check tasks in enrolled subjects
  const subjectIds = enrollments.map(e => e.subjectId);
  if (subjectIds.length > 0) {
    const tasks = await prisma.task.findMany({
      where: { subjectId: { in: subjectIds } },
      select: { id: true, title: true, subjectId: true }
    });
    console.log("Tasks in enrolled subjects:", tasks.length);
  } else {
    console.log("No enrollments found for Chris!");
  }

  // Check InviteCode for Chris
  const inviteCode = await prisma.inviteCode.findFirst({
    where: { userId: chris.id },
    select: { id: true, code: true, label: true }
  });
  console.log("Chris invite code:", inviteCode);
}

checkChris()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
