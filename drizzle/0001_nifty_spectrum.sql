CREATE TABLE "challenge_records" (
	"user_id" text NOT NULL,
	"challenge_id" text NOT NULL,
	"best_score" integer DEFAULT 0 NOT NULL,
	"cleared" boolean DEFAULT false NOT NULL,
	"perfect" boolean DEFAULT false NOT NULL,
	"play_count" integer DEFAULT 0 NOT NULL,
	"cleared_at" timestamp with time zone,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "challenge_records_user_id_challenge_id_pk" PRIMARY KEY("user_id","challenge_id")
);
