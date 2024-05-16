Files placed in this directory will get seeded at server start.
JSON should conform to: `./app/src/services/types/Seeder`

Seeder `.js` or `.ts` scripts can also be placed in the `./app/src/services/seeders/` directory. The files should have a single async method export.

```JavaScript
const main = async (prisma) => {
    const user = { id: "1", name: "Test User", email: "test-user@test.com", role: "user", password: "password" };
    await prisma.user.upsert({
            where: { id: "1" },
            update: user,
            create: user,
        });
};

export default main;
```
