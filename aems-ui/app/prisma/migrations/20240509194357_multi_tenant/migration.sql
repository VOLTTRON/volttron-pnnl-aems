-- CreateTable
CREATE TABLE "_Units_users" (
    "A" INTEGER NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_Units_users_AB_unique" ON "_Units_users"("A", "B");

-- CreateIndex
CREATE INDEX "_Units_users_B_index" ON "_Units_users"("B");

-- AddForeignKey
ALTER TABLE "_Units_users" ADD CONSTRAINT "_Units_users_A_fkey" FOREIGN KEY ("A") REFERENCES "Units"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_Units_users" ADD CONSTRAINT "_Units_users_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
