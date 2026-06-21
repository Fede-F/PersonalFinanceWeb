import { pgTable, uuid, text, timestamp, varchar, decimal, unique, jsonb, integer, primaryKey, boolean } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import type { AdapterAccountType } from "next-auth/adapters";

// --- Auth.js / NextAuth Required Tables ---

export const users = pgTable("users", {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name"),
    email: varchar("email", { length: 255 }).notNull().unique(),
    emailVerified: timestamp("email_verified", { mode: "date" }),
    image: text("image"),
    password: text("password"),
    defaultCurrency: varchar("default_currency", { length: 3 }).notNull().default("USD").references(() => supportedCurrencies.code),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const accounts = pgTable(
    "accounts",
    {
        userId: uuid("user_id")
            .notNull()
            .references(() => users.id, { onDelete: "cascade" }),
        type: text("type").$type<AdapterAccountType>().notNull(),
        provider: text("provider").notNull(),
        providerAccountId: text("provider_account_id").notNull(),
        refresh_token: text("refresh_token"),
        access_token: text("access_token"),
        expires_at: integer("expires_at"),
        token_type: text("token_type"),
        scope: text("scope"),
        id_token: text("id_token"),
        session_state: text("session_state"),
    },
    (account) => ({
        compoundKey: primaryKey({
            columns: [account.provider, account.providerAccountId],
        }),
    })
);

export const sessions = pgTable("sessions", {
    sessionToken: text("session_token").primaryKey(),
    userId: uuid("user_id")
        .notNull()
        .references(() => users.id, { onDelete: "cascade" }),
    expires: timestamp("expires", { mode: "date" }).notNull(),
});

export const verificationTokens = pgTable(
    "verification_tokens",
    {
        identifier: text("identifier").notNull(),
        token: text("token").notNull(),
        expires: timestamp("expires", { mode: "date" }).notNull(),
    },
    (vt) => ({
        compoundKey: primaryKey({ columns: [vt.identifier, vt.token] }),
    })
);

// --- Global / System Tables ---

export const supportedCurrencies = pgTable("supported_currencies", {
    code: varchar("code", { length: 3 }).primaryKey(), // e.g., 'USD', 'ARS', 'BRL'
    name: text("name").notNull(),
    type: varchar("type", { length: 20 }).notNull(), // 'FIAT', 'CRYPTO'
});

export const marketRates = pgTable("market_rates", {
    id: uuid("id").primaryKey().defaultRandom(),
    baseCurrency: varchar("base_currency", { length: 3 }).notNull().references(() => supportedCurrencies.code),
    targetCurrency: varchar("target_currency", { length: 3 }).notNull().references(() => supportedCurrencies.code),
    rate: decimal("rate", { precision: 20, scale: 10 }).notNull(),
    date: timestamp("date").notNull(),
}, (t) => ({
    uniquePairDate: unique().on(t.baseCurrency, t.targetCurrency, t.date),
}));

// --- Tenant Tables (Multi-tenancy) ---

export const workspaces = pgTable("workspaces", {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    ownerId: uuid("owner_id").notNull().references(() => users.id),
    baseCurrency: varchar("base_currency", { length: 3 }).notNull().references(() => supportedCurrencies.code),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const workspaceMembers = pgTable("workspace_members", {
    workspaceId: uuid("workspace_id").notNull().references(() => workspaces.id, { onDelete: 'cascade' }),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
    role: varchar("role", { length: 20 }).notNull(), // 'OWNER', 'EDITOR', 'VIEWER'
    permissions: jsonb("permissions").default({}),
    joinedAt: timestamp("joined_at").defaultNow().notNull(),
}, (t) => ({
    pk: unique().on(t.workspaceId, t.userId),
}));

export const financialAccounts = pgTable("financial_accounts", {
    id: uuid("id").primaryKey().defaultRandom(),
    workspaceId: uuid("workspace_id").notNull().references(() => workspaces.id, { onDelete: 'cascade' }),
    name: text("name").notNull(),
    type: varchar("type", { length: 20 }).notNull(), // 'CASH', 'BANK', 'CREDIT_CARD', 'INVESTMENT'
    currency: varchar("currency", { length: 3 }).notNull().references(() => supportedCurrencies.code),
    balance: decimal("balance", { precision: 20, scale: 2 }).notNull().default("0"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const categories = pgTable("categories", {
    id: uuid("id").primaryKey().defaultRandom(),
    workspaceId: uuid("workspace_id").notNull().references(() => workspaces.id, { onDelete: 'cascade' }),
    name: text("name").notNull(),
    icon: text("icon"), // Lucide icon name or emoji
    color: varchar("color", { length: 7 }), // Hex color
    type: varchar("type", { length: 20 }).notNull().default("EXPENSE"), // 'INCOME', 'EXPENSE', 'BOTH'
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const transactions = pgTable("transactions", {
    id: uuid("id").primaryKey().defaultRandom(),
    workspaceId: uuid("workspace_id").notNull().references(() => workspaces.id, { onDelete: 'cascade' }),
    accountId: uuid("account_id").references(() => financialAccounts.id, { onDelete: 'cascade' }),
    categoryId: uuid("category_id").references(() => categories.id),
    type: varchar("type", { length: 20 }).notNull(), // 'INCOME', 'EXPENSE', 'TRANSFER'
    concept: text("concept").notNull(),
    amount: decimal("amount", { precision: 20, scale: 2 }).notNull(),
    currency: varchar("currency", { length: 3 }).notNull().references(() => supportedCurrencies.code),
    exchangeRate: decimal("exchange_rate", { precision: 20, scale: 10 }).notNull().default("1.0"), // Snapshot at transaction time
    date: timestamp("date").notNull().defaultNow(),
    description: text("description"), // This is 'Detalle'
    isFixed: boolean("is_fixed").default(false).notNull(),
    isInstallments: boolean("is_installments").default(false).notNull(),
    installmentsCount: integer("installments_count"),
    parentId: uuid("parent_id"),
    installmentNumber: integer("installment_number"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
});


export const accountsRelations = relations(accounts, ({ one }) => ({
    user: one(users, {
        fields: [accounts.userId],
        references: [users.id],
    }),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
    user: one(users, {
        fields: [sessions.userId],
        references: [users.id],
    }),
}));

// --- Relations ---

export const userRelations = relations(users, ({ many }) => ({
    authAccounts: many(accounts),
    sessions: many(sessions),
    memberships: many(workspaceMembers),
    ownedWorkspaces: many(workspaces),
}));

export const workspaceRelations = relations(workspaces, ({ one, many }) => ({
    owner: one(users, {
        fields: [workspaces.ownerId],
        references: [users.id],
    }),
    members: many(workspaceMembers),
    financialAccounts: many(financialAccounts),
    categories: many(categories),
    transactions: many(transactions),
}));

export const workspaceMemberRelations = relations(workspaceMembers, ({ one }) => ({
    workspace: one(workspaces, {
        fields: [workspaceMembers.workspaceId],
        references: [workspaces.id],
    }),
    user: one(users, {
        fields: [workspaceMembers.userId],
        references: [users.id],
    }),
}));

export const financialAccountRelations = relations(financialAccounts, ({ one, many }) => ({
    workspace: one(workspaces, {
        fields: [financialAccounts.workspaceId],
        references: [workspaces.id],
    }),
    transactions: many(transactions),
}));

export const categoryRelations = relations(categories, ({ one, many }) => ({
    workspace: one(workspaces, {
        fields: [categories.workspaceId],
        references: [workspaces.id],
    }),
    transactions: many(transactions),
}));

export const transactionRelations = relations(transactions, ({ one }) => ({
    workspace: one(workspaces, {
        fields: [transactions.workspaceId],
        references: [workspaces.id],
    }),
    account: one(financialAccounts, {
        fields: [transactions.accountId],
        references: [financialAccounts.id],
    }),
    category: one(categories, {
        fields: [transactions.categoryId],
        references: [categories.id],
    }),
}));
