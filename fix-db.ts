import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function deleteWen() {
  const wen = await prisma.user.findFirst({
    where: { name: "wen" },
    select: { id: true, name: true },
  });
  
  if (!wen) {
    console.log("wen user not found - already deleted or doesn't exist");
    return;
  }
  
  // Delete related data first
  await prisma.userEnrollment.deleteMany({ where: { userId: wen.id } });
  await prisma.taskCompletion.deleteMany({ where: { userId: wen.id } });
  await prisma.inviteCode.deleteMany({ where: { createdById: wen.id } });
  await prisma.inviteCode.deleteMany({ where: { userId: wen.id } });
  
  // Delete the user
  await prisma.user.delete({ where: { id: wen.id } });
  console.log(`Deleted user: ${wen.name} (${wen.id})`);
  
  // Verify
  const remaining = await prisma.user.findMany({
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });
  console.log("Remaining users:", remaining.map(u => u.name).join(", "));
}

deleteWen().catch(console.error).finally(() => prisma.$disconnect());
