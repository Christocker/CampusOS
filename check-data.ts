import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function checkData() {
  // Check users
  const users = await prisma.user.findMany({ select: { id: true, name: true, email: true } });
  console.log("Users:", users);

  // Check subjects
  const subjects = await prisma.subject.findMany({ select: { id: true, name: true } });
  console.log("Subjects:", subjects);

  // Check enrollments
  const enrollments = await prisma.userEnrollment.findMany();
  console.log("Enrollments:", enrollments);

  // Check tasks
  const tasks = await prisma.task.findMany({ select: { id: true, title: true, subjectId: true, userId: true } });
  console.log("Tasks:", tasks);
}

checkData()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
