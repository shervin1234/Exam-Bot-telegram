# Exam-Bot-Telegram

### About the Project | درباره پروژه

**English:**  
Exam-Bot-Telegram is a highly customizable and professional Telegram bot written in TypeScript. The bot uses a modular command handler system where any new command added to the `commands` folder is automatically registered and handled. This makes it easy to extend the bot's functionality without touching the core codebase.

**فارسی:**  
ربات تلگرام Exam-Bot-Telegram یک ربات حرفه‌ای و قابل سفارشی‌سازی است که با TypeScript نوشته شده. این ربات از یک سیستم مدیریت دستورات ماژولار استفاده می‌کند که هر دستوری را که به پوشه `commands` اضافه کنید، به صورت خودکار شناسایی و مدیریت می‌کند. این قابلیت توسعه ربات را بسیار آسان می‌کند.

---

### Features | امکانات

**English:**  
- Auto-registration of commands in the `commands` folder.  
- Stores logs in the `logs` folder for easy debugging and monitoring.  
- Written in TypeScript for type safety and scalability.  
- Simple and clear setup process.  

**فارسی:**  
- ثبت خودکار دستورات در پوشه `commands`.  
- ذخیره تمامی لاگ‌ها در پوشه `logs` برای دیباگ و مانیتورینگ آسان.  
- نوشته شده با TypeScript برای ایمنی و مقیاس‌پذیری کد.  
- فرآیند نصب ساده و شفاف.

---

### Prerequisites | پیش‌نیازها

- Node.js (v16 یا بالاتر)  
- [Bun](https://bun.sh/) (اختیاری اما پیشنهاد می‌شود برای سرعت بهتر)  

---

### Installation | نصب

**English:**  
1. Clone the repository:  
   ```bash
   git clone https://github.com/your-username/Exam-Bot-Telegram.git
2. Navigate to the project folder:
    ```bash
        cd Exam-Bot-Telegram
3. Install dependencies (choose one):
    Using npm:
        
            npm install

    Using Bun:
     
            bun install



4. Generate Prisma client:

        npm run prisma:generate
        or
        bun run prisma:generate


5. Start the bot in development mode:

        npm run dev
        or
        bun run dev


6. Logs will be saved in the logs folder.



فارسی:

1. ریپازیتوری را کلون کنید:
   ```bash
   git clone https://github.com/your-username/Exam-Bot-Telegram.git


2. وارد پوشه پروژه شوید:
    ```bash
        cd Exam-Bot-Telegram


3. وابستگی‌ها را نصب کنید (یکی از دو روش زیر):

با استفاده از npm:

    npm install

با استفاده از Bun:

    bun install



4. کلاینت Prisma را بسازید:

        npm run prisma:generate
        یا
        bun run prisma:generate

5. ربات را در حالت توسعه اجرا کنید:

        npm run dev
        یا
        bun run dev


6. لاگ‌ها در پوشه logs ذخیره خواهند شد.




---

Notes | نکات

English:

The commands.json file has a bug that needs fixing.

Logs might not function as expected; this issue also needs attention.

Enjoy exploring and extending the code!


فارسی:

فایل commands.json دارای باگ است و نیاز به اصلاح دارد.

سیستم لاگ ممکن است به درستی کار نکند؛ این مشکل نیز باید بررسی شود.

از بررسی و توسعه کد لذت ببرید!



---

Example Commands | نمونه دستورات
    ```ts
    import {Context, Telegraf} from "telegraf";
    import {Command, ensureValidUserId} from "../handlers/CommandFactory";

    export default new Command("start")
        .setHandler(async (ctx: Context , bot?: Telegraf<Context>): Promise<void> => {
            try {
                await ensureValidUserId(ctx);
                await ctx.reply("test")
            } catch (error) {
                console.error("Error in start command:", error);
                await ctx.reply("❌ An error occurred while processing your request. Please try again later.");
            }
        });

---

## Prisma Schema

This project uses **Prisma ORM** with a PostgreSQL database. Below is the schema used for managing users, transactions, purchases, and invites.  

### Overview

The schema defines the following models and their relations:  

1. **UserHandler**  
   - Represents users of the bot.  
   - Includes user information, roles, wallet balance, and activity tracking.  
   - Supports relations for invites, purchases, and transactions.

2. **Transaction**  
   - Tracks user transactions with status, amount, and optional receipt ID.  
   - Related to `UserHandler`.

3. **Purchase**  
   - Logs user purchases with product name and amount.  
   - Related to `UserHandler`.

4. **Invite**  
   - Manages invitations sent and received by users.  
   - Includes relations for the inviter and invited users.

5. **Role (Enum)**  
   - Defines user roles: `DEFAULT`, `ADMIN`, and `PARTNER`.

---

### Schema Details  

    
    generator client {
    provider = "prisma-client-js"
    }

    datasource db {
    provider = "postgresql"
    url      = env("DATABASE_URL")
    }

    model UserHandler {
    id           Int       @id @default(autoincrement())
    username     String?   @unique
    firstName    String?
    lastName     String?
    phone        String?  
    userid       BigInt    @unique
    role         Role      @default(DEFAULT)
    languageCode String?
    bio          String?
    createdAt    DateTime  @default(now())
    updatedAt    DateTime  @updatedAt
    lastActiveAt DateTime?
    wallet       BigInt    @default(0)
    referrerId   BigInt?
    isBanned     Boolean   @default(false)
    acceptedRules Boolean  @default(false)

    invitesSent     Invite[]   @relation("InviterRelation")
    invitesReceived Invite[]   @relation("InvitedRelation")
    purchases       Purchase[]
    transactions    Transaction[]   
    }

    model Transaction {
    id          BigInt   @id @default(autoincrement()) 
    userId      BigInt                              
    user        UserHandler     @relation(fields: [userId], references: [userid])
    amount      Float                                 
    status      String   @default("pending")         
    createdAt   DateTime @default(now())             
    receiptId   String?                              
    }

    model Purchase {
    id          Int      @id @default(autoincrement())
    userId      BigInt
    productName String
    amount      Int
    createdAt   DateTime @default(now())
    user        UserHandler     @relation(fields: [userId], references: [userid])
    }

    model Invite {
    id        Int      @id @default(autoincrement())
    inviterId BigInt
    invitedId BigInt
    createdAt DateTime @default(now())
    inviter   UserHandler     @relation("InviterRelation", fields: [inviterId], references: [userid])
    invited   UserHandler     @relation("InvitedRelation", fields: [invitedId], references: [userid])
    }

    enum Role {
    DEFAULT
    ADMIN
    PARTNER
    }

---

Contributing | مشارکت

Feel free to fork the repository, make changes, and create pull requests. Contributions are always welcome!


---

License | مجوز

This project is licensed under the MIT License.



