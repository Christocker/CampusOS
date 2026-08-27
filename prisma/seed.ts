import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = "chrisengada2006@gmail.com";
  const passwordHash = await bcrypt.hash("password123", 12);

  const user = await prisma.user.upsert({
    where: { email },
    update: {},
    create: { name: "Admin", email, passwordHash, role: "ADMIN" },
  });

  const existing = await prisma.subject.count({ where: { userId: user.id } });
  if (existing > 0) {
    console.log("Seed data already present. Skipping.");
    return;
  }

  const electronics = await prisma.subject.create({
    data: {
      name: "Digital Electronics",
      professor: "Dr. Smith",
      semester: "Fall 2026",
      color: "#007AFF",
      description: "Logic design, circuits, and lab work.",
      userId: user.id,
      tasks: {
        create: [
          { title: "Finish Digital Electronics Lab", priority: "HIGH", status: "IN_PROGRESS", deadline: new Date(Date.now() + 1000 * 60 * 60 * 6), userId: user.id },
          { title: "Read chapter 4", priority: "LOW", status: "NOT_STARTED", deadline: new Date(Date.now() + 1000 * 60 * 60 * 24 * 3), userId: user.id },
        ],
      },
    },
  });

  await prisma.subject.create({
    data: {
      name: "Communications",
      professor: "Prof. Lee",
      semester: "Fall 2026",
      color: "#34C759",
      userId: user.id,
      tasks: {
        create: [
          { title: "Communications Assignment", priority: "MEDIUM", status: "NOT_STARTED", deadline: new Date(Date.now() + 1000 * 60 * 60 * 24 * 2), userId: user.id },
        ],
      },
    },
  });

  const group = await prisma.group.create({
    data: {
      name: "ECET315 Group",
      description: "Study group for the capstone.",
      ownerId: user.id,
      members: { create: { userId: user.id, role: "ADMIN" } },
    },
  });

  await prisma.task.create({
    data: {
      title: "Experiment 3",
      priority: "HIGH",
      status: "NOT_STARTED",
      userId: user.id,
      groupId: group.id,
    },
  });

  await prisma.calendarEvent.create({
    data: {
      title: "Midterm Exam",
      type: "EXAM",
      start: new Date(Date.now() + 1000 * 60 * 60 * 24 * 5),
      userId: user.id,
      subjectId: electronics.id,
    },
  });

  console.log("Seed complete. Login: chrisengada2006@gmail.com / password123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
