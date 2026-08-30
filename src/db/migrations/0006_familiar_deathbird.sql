CREATE TABLE "asset_market_prices" (
	"symbol" varchar(20) PRIMARY KEY NOT NULL,
	"name" text,
	"asset_type" varchar(20),
	"price" numeric(20, 6) NOT NULL,
	"currency" varchar(3) NOT NULL,
	"change_24h_pct" numeric(8, 4),
	"last_updated" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "asset_price_history" (
	"symbol" varchar(20) NOT NULL,
	"date" varchar(10) NOT NULL,
	"close_price" numeric(20, 6) NOT NULL,
	"currency" varchar(3) NOT NULL,
	CONSTRAINT "asset_price_history_symbol_date_pk" PRIMARY KEY("symbol","date")
);
--> statement-breakpoint
CREATE TABLE "investment_assets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid,
	"symbol" varchar(20) NOT NULL,
	"name" text NOT NULL,
	"asset_type" varchar(20) DEFAULT 'STOCK' NOT NULL,
	"default_currency" varchar(3) DEFAULT 'USD' NOT NULL,
	"icon" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "investment_transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"asset_id" uuid NOT NULL,
	"type" varchar(20) DEFAULT 'BUY' NOT NULL,
	"quantity" text NOT NULL,
	"unit_price" text NOT NULL,
	"total_amount" text NOT NULL,
	"currency" varchar(3) NOT NULL,
	"exchange_rate" numeric(20, 10) DEFAULT '1.0' NOT NULL,
	"fees" text,
	"date" timestamp DEFAULT now() NOT NULL,
	"notes" text,
	"created_by_id" uuid,
	"linked_transaction_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "investment_assets" ADD CONSTRAINT "investment_assets_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "investment_assets" ADD CONSTRAINT "investment_assets_default_currency_supported_currencies_code_fk" FOREIGN KEY ("default_currency") REFERENCES "public"."supported_currencies"("code") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "investment_transactions" ADD CONSTRAINT "investment_transactions_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "investment_transactions" ADD CONSTRAINT "investment_transactions_asset_id_investment_assets_id_fk" FOREIGN KEY ("asset_id") REFERENCES "public"."investment_assets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "investment_transactions" ADD CONSTRAINT "investment_transactions_currency_supported_currencies_code_fk" FOREIGN KEY ("currency") REFERENCES "public"."supported_currencies"("code") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "investment_transactions" ADD CONSTRAINT "investment_transactions_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "investment_transactions" ADD CONSTRAINT "investment_transactions_linked_transaction_id_transactions_id_fk" FOREIGN KEY ("linked_transaction_id") REFERENCES "public"."transactions"("id") ON DELETE set null ON UPDATE no action;