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
    theme: varchar("theme", { length: 20 }).notNull().default("system"),
    lastActiveWorkspaceId: uuid("last_active_workspace_id"),
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
    uniquePair: unique().on(t.baseCurrency, t.targetCurrency),
}));

export const notifications = pgTable("notifications", {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
    type: varchar("type", { length: 50 }).notNull(), // 'WORKSPACE_INVITATION', 'GENERAL'
    title: text("title").notNull(),
    message: text("message").notNull(),
    read: boolean("read").default(false).notNull(),
    data: jsonb("data").default({}).$type<{ workspaceId?: string, workspaceName?: string, role?: string, status?: 'PENDING' | 'ACCEPTED' | 'REJECTED' }>(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
});

// --- Tenant Tables (Multi-tenancy) ---

export const workspaces = pgTable("workspaces", {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    ownerId: uuid("owner_id").notNull().references(() => users.id),
    baseCurrency: varchar("base_currency", { length: 3 }).notNull().references(() => supportedCurrencies.code),
    lastFixedExtensionCheck: timestamp("last_fixed_extension_check"),
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
    isActive: boolean("is_active").default(true).notNull(),
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
    amount: text("amount").notNull(),
    currency: varchar("currency", { length: 3 }).notNull().references(() => supportedCurrencies.code),
    exchangeRate: decimal("exchange_rate", { precision: 20, scale: 10 }).notNull().default("1.0"), // Snapshot at transaction time
    date: timestamp("date").notNull().defaultNow(),
    description: text("description"), // This is 'Detalle'
    isFixed: boolean("is_fixed").default(false).notNull(),
    isInstallments: boolean("is_installments").default(false).notNull(),
    installmentsCount: integer("installments_count"),
    parentId: uuid("parent_id"),
    installmentNumber: integer("installment_number"),
    createdById: uuid("created_by_id").references(() => users.id, { onDelete: 'set null' }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const conceptBlacklist = pgTable("concept_blacklist", {
    id: uuid("id").primaryKey().defaultRandom(),
    workspaceId: uuid("workspace_id").notNull().references(() => workspaces.id, { onDelete: 'cascade' }),
    concept: text("concept").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => ({
    uniqueWorkspaceConcept: unique().on(t.workspaceId, t.concept),
}));

// --- Investments Module Tables ---

export const investmentCategories = pgTable("investment_categories", {
    id: uuid("id").primaryKey().defaultRandom(),
    workspaceId: uuid("workspace_id").references(() => workspaces.id, { onDelete: 'cascade' }), // null = global/system
    name: varchar("name", { length: 50 }).notNull(), // e.g. 'CRYPTO', 'CEDEAR', 'INMUEBLES'
    label: text("label").notNull(), // e.g. 'Criptomonedas', 'Bienes Raíces'
    color: varchar("color", { length: 20 }).notNull().default("#8b5cf6"),
    isSystem: boolean("is_system").default(false).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const investmentAssets = pgTable("investment_assets", {
    id: uuid("id").primaryKey().defaultRandom(),
    workspaceId: uuid("workspace_id").references(() => workspaces.id, { onDelete: 'cascade' }), // null = global/system asset
    symbol: varchar("symbol", { length: 20 }).notNull(), // e.g. 'BTC', 'AAPL', 'SPY.BA'
    name: text("name").notNull(), // e.g. 'Bitcoin', 'Apple Inc', 'SPDR S&P 500 ETF (CEDEAR)'
    assetType: varchar("asset_type", { length: 20 }).notNull().default("STOCK"), // 'CRYPTO', 'STOCK', 'ETF', 'CEDEAR', 'BOND', 'OTHER'
    defaultCurrency: varchar("default_currency", { length: 3 }).notNull().default("USD").references(() => supportedCurrencies.code),
    icon: text("icon"),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const investmentTransactions = pgTable("investment_transactions", {
    id: uuid("id").primaryKey().defaultRandom(),
    workspaceId: uuid("workspace_id").notNull().references(() => workspaces.id, { onDelete: 'cascade' }),
    assetId: uuid("asset_id").notNull().references(() => investmentAssets.id, { onDelete: 'cascade' }),
    type: varchar("type", { length: 20 }).notNull().default("BUY"), // 'BUY', 'SELL', 'DIVIDEND'
    quantity: text("quantity").notNull(), // Encrypted: quantity of shares/tokens
    unitPrice: text("unit_price").notNull(), // Encrypted: price per unit in 'currency'
    totalAmount: text("total_amount").notNull(), // Encrypted: total spent/received
    currency: varchar("currency", { length: 3 }).notNull().references(() => supportedCurrencies.code),
    exchangeRate: decimal("exchange_rate", { precision: 20, scale: 10 }).notNull().default("1.0"), // Snapshot at transaction time
    fees: text("fees"), // Encrypted: comisiones
    date: timestamp("date").notNull().defaultNow(),
    notes: text("notes"),
    createdById: uuid("created_by_id").references(() => users.id, { onDelete: 'set null' }),
    linkedTransactionId: uuid("linked_transaction_id").references(() => transactions.id, { onDelete: 'set null' }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const assetMarketPrices = pgTable("asset_market_prices", {
    symbol: varchar("symbol", { length: 20 }).primaryKey(), // e.g. 'BTC', 'AAPL', 'SPY.BA'
    name: text("name"),
    assetType: varchar("asset_type", { length: 20 }),
    price: decimal("price", { precision: 20, scale: 6 }).notNull(),
    currency: varchar("currency", { length: 3 }).notNull(), // 'USD', 'ARS'
    change24hPct: decimal("change_24h_pct", { precision: 8, scale: 4 }),
    lastUpdated: timestamp("last_updated").notNull().defaultNow(),
});

export const assetPriceHistory = pgTable("asset_price_history", {
    symbol: varchar("symbol", { length: 20 }).notNull(),
    date: varchar("date", { length: 10 }).notNull(), // 'YYYY-MM-DD'
    closePrice: decimal("close_price", { precision: 20, scale: 6 }).notNull(),
    currency: varchar("currency", { length: 3 }).notNull(),
}, (t) => ({
    pk: primaryKey({ columns: [t.symbol, t.date] }),
}));

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
    notifications: many(notifications),
    createdTransactions: many(transactions),
    createdInvestments: many(investmentTransactions),
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
    conceptBlacklist: many(conceptBlacklist),
    investmentAssets: many(investmentAssets),
    investmentTransactions: many(investmentTransactions),
}));

export const conceptBlacklistRelations = relations(conceptBlacklist, ({ one }) => ({
    workspace: one(workspaces, {
        fields: [conceptBlacklist.workspaceId],
        references: [workspaces.id],
    }),
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
    creator: one(users, {
        fields: [transactions.createdById],
        references: [users.id],
    }),
}));

export const notificationRelations = relations(notifications, ({ one }) => ({
    user: one(users, {
        fields: [notifications.userId],
        references: [users.id],
    }),
}));

export const investmentAssetRelations = relations(investmentAssets, ({ one, many }) => ({
    workspace: one(workspaces, {
        fields: [investmentAssets.workspaceId],
        references: [workspaces.id],
    }),
    transactions: many(investmentTransactions),
}));

export const investmentTransactionRelations = relations(investmentTransactions, ({ one }) => ({
    workspace: one(workspaces, {
        fields: [investmentTransactions.workspaceId],
        references: [workspaces.id],
    }),
    asset: one(investmentAssets, {
        fields: [investmentTransactions.assetId],
        references: [investmentAssets.id],
    }),
    creator: one(users, {
        fields: [investmentTransactions.createdById],
        references: [users.id],
    }),
    linkedTransaction: one(transactions, {
        fields: [investmentTransactions.linkedTransactionId],
        references: [transactions.id],
    }),
}));
