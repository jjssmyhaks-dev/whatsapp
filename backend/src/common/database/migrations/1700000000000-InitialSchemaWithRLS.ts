import { MigrationInterface, QueryRunner, Table, TableIndex, TableForeignKey } from 'typeorm';

export class InitialSchemaWithRLS1700000000000 implements MigrationInterface {
  name = 'InitialSchemaWithRLS1700000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Enable UUID extension if not already enabled
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    // Create users table (no RLS needed - system table)
    await queryRunner.createTable(
      new Table({
        name: 'users',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true, default: 'uuid_generate_v4()' },
          { name: 'email', type: 'varchar', isUnique: true, isNullable: false },
          { name: 'password_hash', type: 'varchar', isNullable: false },
          { name: 'org_name', type: 'varchar', isNullable: false },
          { name: 'subscription_tier', type: 'varchar', default: "'free'" },
          { name: 'is_active', type: 'boolean', default: false },
          { name: 'is_verified', type: 'boolean', default: false },
          { name: 'verification_token', type: 'varchar', isNullable: true },
          { name: 'verification_token_expires', type: 'timestamp', isNullable: true },
          { name: 'reset_token', type: 'varchar', isNullable: true },
          { name: 'reset_token_expires', type: 'timestamp', isNullable: true },
          { name: 'last_login', type: 'timestamp', isNullable: true },
          { name: 'created_at', type: 'timestamp', default: 'now()' },
          { name: 'updated_at', type: 'timestamp', default: 'now()' },
        ],
      }),
    );

    // Create whatsapp_connections table
    await queryRunner.createTable(
      new Table({
        name: 'whatsapp_connections',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true, default: 'uuid_generate_v4()' },
          { name: 'user_id', type: 'uuid', isNullable: false },
          { name: 'waba_id', type: 'varchar', isNullable: true },
          { name: 'phone_number_id', type: 'varchar', isNullable: false },
          { name: 'business_phone_number', type: 'varchar', isNullable: false },
          { name: 'access_token_encrypted', type: 'text', isNullable: false },
          { name: 'webhook_verify_token', type: 'varchar', isNullable: true },
          { name: 'status', type: 'varchar', default: "'pending'" },
          { name: 'last_sync', type: 'timestamp', isNullable: true },
          { name: 'webhook_url', type: 'varchar', isNullable: true },
          { name: 'meta_api_version', type: 'varchar', default: "'v18.0'" },
          { name: 'created_at', type: 'timestamp', default: 'now()' },
          { name: 'updated_at', type: 'timestamp', default: 'now()' },
        ],
      }),
    );

    // Create contacts table
    await queryRunner.createTable(
      new Table({
        name: 'contacts',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true, default: 'uuid_generate_v4()' },
          { name: 'user_id', type: 'uuid', isNullable: false },
          { name: 'phone_number', type: 'varchar', isNullable: false },
          { name: 'display_name', type: 'varchar', isNullable: true },
          { name: 'whatsapp_name', type: 'varchar', isNullable: true },
          { name: 'is_vip', type: 'boolean', default: false },
          { name: 'tags', type: 'jsonb', default: "'[]'" },
          { name: 'profile_image_url', type: 'varchar', isNullable: true },
          { name: 'last_message_at', type: 'timestamp', isNullable: true },
          { name: 'message_count', type: 'integer', default: 0 },
          { name: 'created_at', type: 'timestamp', default: 'now()' },
          { name: 'updated_at', type: 'timestamp', default: 'now()' },
        ],
      }),
    );

    // Create threads table
    await queryRunner.createTable(
      new Table({
        name: 'threads',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true, default: 'uuid_generate_v4()' },
          { name: 'user_id', type: 'uuid', isNullable: false },
          { name: 'contact_id', type: 'uuid', isNullable: false },
          { name: 'thread_key', type: 'varchar', isNullable: true },
          { name: 'last_message_id', type: 'uuid', isNullable: true },
          { name: 'last_human_reply_at', type: 'timestamp', isNullable: true },
          { name: 'sla_deadline', type: 'timestamp', isNullable: true },
          { name: 'follow_up_sent', type: 'boolean', default: false },
          { name: 'follow_up_count', type: 'integer', default: 0 },
          { name: 'status', type: 'varchar', default: "'open'" },
          { name: 'priority', type: 'varchar', default: "'normal'" },
          { name: 'assignee_id', type: 'uuid', isNullable: true },
          { name: 'metadata', type: 'jsonb', default: "'{}'" },
          { name: 'created_at', type: 'timestamp', default: 'now()' },
          { name: 'updated_at', type: 'timestamp', default: 'now()' },
        ],
      }),
    );

    // Create messages table
    await queryRunner.createTable(
      new Table({
        name: 'messages',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true, default: 'uuid_generate_v4()' },
          { name: 'thread_id', type: 'uuid', isNullable: false },
          { name: 'user_id', type: 'uuid', isNullable: false },
          { name: 'direction', type: 'varchar', default: "'inbound'" },
          { name: 'raw_text', type: 'text', isNullable: true },
          { name: 'payload', type: 'jsonb', isNullable: true },
          { name: 'classification', type: 'varchar', isNullable: true },
          { name: 'confidence', type: 'decimal', precision: 5, scale: 4, isNullable: true },
          { name: 'action_taken', type: 'varchar', isNullable: true },
          { name: 'template_id', type: 'uuid', isNullable: true },
          { name: 'mistral_prompt', type: 'text', isNullable: true },
          { name: 'mistral_response', type: 'text', isNullable: true },
          { name: 'mistral_model', type: 'varchar', isNullable: true },
          { name: 'mistral_tokens_used', type: 'integer', isNullable: true },
          { name: 'fast_path_hit', type: 'boolean', default: false },
          { name: 'fast_path_type', type: 'varchar', isNullable: true },
          { name: 'processing_time_ms', type: 'integer', isNullable: true },
          { name: 'whatsapp_message_id', type: 'varchar', isNullable: true },
          { name: 'whatsapp_status', type: 'varchar', isNullable: true },
          { name: 'error_message', type: 'text', isNullable: true },
          { name: 'created_at', type: 'timestamp', default: 'now()' },
        ],
      }),
    );

    // Create templates table
    await queryRunner.createTable(
      new Table({
        name: 'templates',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true, default: 'uuid_generate_v4()' },
          { name: 'user_id', type: 'uuid', isNullable: false },
          { name: 'name', type: 'varchar', isNullable: false },
          { name: 'trigger_intent', type: 'varchar', isNullable: false },
          { name: 'trigger_embedding', type: 'text', isNullable: true },
          { name: 'reply_text', type: 'text', isNullable: false },
          { name: 'active', type: 'boolean', default: true },
          { name: 'is_urgent_acknowledgement', type: 'boolean', default: false },
          { name: 'response_type', type: 'varchar', default: "'text'" },
          { name: 'metadata', type: 'jsonb', default: "'{}'" },
          { name: 'usage_count', type: 'integer', default: 0 },
          { name: 'last_used_at', type: 'timestamp', isNullable: true },
          { name: 'priority', type: 'integer', default: 0 },
          { name: 'created_at', type: 'timestamp', default: 'now()' },
          { name: 'updated_at', type: 'timestamp', default: 'now()' },
        ],
      }),
    );

    // Create urgency_rules table
    await queryRunner.createTable(
      new Table({
        name: 'urgency_rules',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true, default: 'uuid_generate_v4()' },
          { name: 'user_id', type: 'uuid', isNullable: false },
          { name: 'keyword_or_phrase', type: 'varchar', isNullable: false },
          { name: 'urgency_level', type: 'varchar', isNullable: false },
          { name: 'match_type', type: 'varchar', default: "'contains'" },
          { name: 'is_case_sensitive', type: 'boolean', default: false },
          { name: 'is_active', type: 'boolean', default: true },
          { name: 'priority', type: 'integer', default: 0 },
          { name: 'usage_count', type: 'integer', default: 0 },
          { name: 'last_triggered_at', type: 'timestamp', isNullable: true },
          { name: 'created_at', type: 'timestamp', default: 'now()' },
          { name: 'updated_at', type: 'timestamp', default: 'now()' },
        ],
      }),
    );

    // Create notifications table
    await queryRunner.createTable(
      new Table({
        name: 'notifications',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true, default: 'uuid_generate_v4()' },
          { name: 'user_id', type: 'uuid', isNullable: false },
          { name: 'thread_id', type: 'uuid', isNullable: true },
          { name: 'message_id', type: 'uuid', isNullable: true },
          { name: 'notification_type', type: 'varchar', isNullable: false },
          { name: 'title', type: 'varchar', isNullable: true },
          { name: 'body', type: 'text', isNullable: true },
          { name: 'payload', type: 'jsonb', isNullable: true },
          { name: 'channel', type: 'varchar', default: "'push'" },
          { name: 'recipient_token', type: 'varchar', isNullable: true },
          { name: 'sent_at', type: 'timestamp', isNullable: true },
          { name: 'delivered', type: 'boolean', default: false },
          { name: 'delivered_at', type: 'timestamp', isNullable: true },
          { name: 'read', type: 'boolean', default: false },
          { name: 'read_at', type: 'timestamp', isNullable: true },
          { name: 'error_message', type: 'text', isNullable: true },
          { name: 'created_at', type: 'timestamp', default: 'now()' },
          { name: 'updated_at', type: 'timestamp', default: 'now()' },
        ],
      }),
    );

    // Create subscriptions table
    await queryRunner.createTable(
      new Table({
        name: 'subscriptions',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true, default: 'uuid_generate_v4()' },
          { name: 'user_id', type: 'uuid', isNullable: false },
          { name: 'plan', type: 'varchar', isNullable: false },
          { name: 'status', type: 'varchar', default: "'active'" },
          { name: 'razorpay_customer_id', type: 'varchar', isNullable: true },
          { name: 'razorpay_subscription_id', type: 'varchar', isNullable: true },
          { name: 'razorpay_plan_id', type: 'varchar', isNullable: true },
          { name: 'billing_cycle', type: 'varchar', default: "'monthly'" },
          { name: 'current_period_start', type: 'timestamp', isNullable: true },
          { name: 'current_period_end', type: 'timestamp', isNullable: true },
          { name: 'trial_start', type: 'timestamp', isNullable: true },
          { name: 'trial_end', type: 'timestamp', isNullable: true },
          { name: 'usage_current_period', type: 'integer', default: 0 },
          { name: 'usage_limit', type: 'integer', default: 100 },
          { name: 'message_count', type: 'integer', default: 0 },
          { name: 'last_billed_at', type: 'timestamp', isNullable: true },
          { name: 'next_billing_at', type: 'timestamp', isNullable: true },
          { name: 'cancel_at_period_end', type: 'boolean', default: false },
          { name: 'cancelled_at', type: 'timestamp', isNullable: true },
          { name: 'metadata', type: 'jsonb', default: "'{}'" },
          { name: 'created_at', type: 'timestamp', default: 'now()' },
          { name: 'updated_at', type: 'timestamp', default: 'now()' },
        ],
      }),
    );

    // Create system_config table (no RLS)
    await queryRunner.createTable(
      new Table({
        name: 'system_config',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true, default: 'uuid_generate_v4()' },
          { name: 'key', type: 'varchar', isUnique: true, isNullable: false },
          { name: 'value', type: 'text', isNullable: true },
          { name: 'config_type', type: 'varchar', default: "'string'" },
          { name: 'is_sensitive', type: 'boolean', default: false },
          { name: 'description', type: 'varchar', isNullable: true },
          { name: 'category', type: 'varchar', isNullable: true },
          { name: 'created_at', type: 'timestamp', default: 'now()' },
          { name: 'updated_at', type: 'timestamp', default: 'now()' },
        ],
      }),
    );

    // Create indexes for performance
    await queryRunner.createIndex('whatsapp_connections', new TableIndex({
      name: 'IDX_whatsapp_connections_user_id',
      columnNames: ['user_id'],
    }));

    await queryRunner.createIndex('contacts', new TableIndex({
      name: 'IDX_contacts_user_id_phone_number',
      columnNames: ['user_id', 'phone_number'],
    }));

    await queryRunner.createIndex('threads', new TableIndex({
      name: 'IDX_threads_user_id',
      columnNames: ['user_id'],
    }));

    await queryRunner.createIndex('threads', new TableIndex({
      name: 'IDX_threads_contact_id',
      columnNames: ['contact_id'],
    }));

    await queryRunner.createIndex('messages', new TableIndex({
      name: 'IDX_messages_thread_id',
      columnNames: ['thread_id'],
    }));

    await queryRunner.createIndex('messages', new TableIndex({
      name: 'IDX_messages_user_id',
      columnNames: ['user_id'],
    }));

    await queryRunner.createIndex('messages', new TableIndex({
      name: 'IDX_messages_whatsapp_message_id',
      columnNames: ['whatsapp_message_id'],
    }));

    await queryRunner.createIndex('templates', new TableIndex({
      name: 'IDX_templates_user_id',
      columnNames: ['user_id'],
    }));

    await queryRunner.createIndex('templates', new TableIndex({
      name: 'IDX_templates_trigger_intent',
      columnNames: ['trigger_intent'],
    }));

    await queryRunner.createIndex('urgency_rules', new TableIndex({
      name: 'IDX_urgency_rules_user_id',
      columnNames: ['user_id'],
    }));

    await queryRunner.createIndex('notifications', new TableIndex({
      name: 'IDX_notifications_user_id',
      columnNames: ['user_id'],
    }));

    await queryRunner.createIndex('subscriptions', new TableIndex({
      name: 'IDX_subscriptions_user_id',
      columnNames: ['user_id'],
    }));

    // ============================================
    // ROW-LEVEL SECURITY (RLS) POLICIES
    // ============================================
    // These policies ensure that users can only access their own data

    // Enable RLS on all multi-tenant tables
    const multiTenantTables = [
      'whatsapp_connections',
      'contacts',
      'threads',
      'messages',
      'templates',
      'urgency_rules',
      'notifications',
      'subscriptions',
    ];

    for (const table of multiTenantTables) {
      // Enable RLS on the table
      await queryRunner.query(`ALTER TABLE ${table} ENABLE ROW LEVEL SECURITY`);

      // Create policy to allow users to access only their own data
      // This assumes the application sets the user_id in the session
      await queryRunner.query(`
        CREATE POLICY ${table}_user_policy ON ${table}
        USING (user_id = current_setting('app.current_user_id')::uuid)
      `);

      // For tables that need to be queried by other users (e.g., for admin purposes),
      // we'll create additional policies as needed
    }

    // Special case: messages also need to be accessible by thread_id for thread views
    await queryRunner.query(`
      CREATE POLICY messages_thread_policy ON messages
      USING (
        user_id = current_setting('app.current_user_id')::uuid OR
        thread_id IN (
          SELECT id FROM threads WHERE user_id = current_setting('app.current_user_id')::uuid
        )
      )
    `);

    // Create a function to set the current user for RLS
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION set_current_user(user_id uuid)
      RETURNS void AS $$
      BEGIN
        PERFORM set_config('app.current_user_id', user_id::text, false);
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;
    `);

    // Create a function to clear the current user
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION clear_current_user()
      RETURNS void AS $$
      BEGIN
        PERFORM set_config('app.current_user_id', '', false);
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;
    `);

    console.log('RLS policies created successfully');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop RLS policies and functions
    const multiTenantTables = [
      'whatsapp_connections',
      'contacts',
      'threads',
      'messages',
      'templates',
      'urgency_rules',
      'notifications',
      'subscriptions',
    ];

    for (const table of multiTenantTables) {
      await queryRunner.query(`ALTER TABLE ${table} DISABLE ROW LEVEL SECURITY`);
      await queryRunner.query(`DROP POLICY IF EXISTS ${table}_user_policy ON ${table}`);
    }

    await queryRunner.query(`DROP POLICY IF EXISTS messages_thread_policy ON messages`);
    await queryRunner.query(`DROP FUNCTION IF EXISTS set_current_user(uuid)`);
    await queryRunner.query(`DROP FUNCTION IF EXISTS clear_current_user()`);

    // Drop tables in reverse order
    await queryRunner.dropTable('system_config');
    await queryRunner.dropTable('subscriptions');
    await queryRunner.dropTable('notifications');
    await queryRunner.dropTable('urgency_rules');
    await queryRunner.dropTable('templates');
    await queryRunner.dropTable('messages');
    await queryRunner.dropTable('threads');
    await queryRunner.dropTable('contacts');
    await queryRunner.dropTable('whatsapp_connections');
    await queryRunner.dropTable('users');
  }
}
