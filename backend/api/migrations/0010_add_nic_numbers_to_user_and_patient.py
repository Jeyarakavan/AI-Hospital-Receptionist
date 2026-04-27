from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("api", "0009_appointment_patient_email_description"),
    ]

    operations = [
        migrations.SeparateDatabaseAndState(
            database_operations=[
                migrations.RunSQL(
                    sql="""
                    DO $$
                    BEGIN
                        IF NOT EXISTS (
                            SELECT 1 FROM information_schema.columns
                            WHERE table_name='users' AND column_name='nic_number'
                        ) THEN
                            ALTER TABLE users ADD COLUMN nic_number VARCHAR(50);
                        END IF;

                        IF NOT EXISTS (
                            SELECT 1 FROM information_schema.columns
                            WHERE table_name='patients' AND column_name='nic_number'
                        ) THEN
                            ALTER TABLE patients ADD COLUMN nic_number VARCHAR(50);
                        END IF;
                    END $$;
                    """,
                    reverse_sql="""
                    DO $$
                    BEGIN
                        IF EXISTS (
                            SELECT 1 FROM information_schema.columns
                            WHERE table_name='users' AND column_name='nic_number'
                        ) THEN
                            ALTER TABLE users DROP COLUMN nic_number;
                        END IF;

                        IF EXISTS (
                            SELECT 1 FROM information_schema.columns
                            WHERE table_name='patients' AND column_name='nic_number'
                        ) THEN
                            ALTER TABLE patients DROP COLUMN nic_number;
                        END IF;
                    END $$;
                    """,
                ),
                migrations.RunSQL(
                    sql="CREATE INDEX IF NOT EXISTS users_nic_number_idx ON users (nic_number);",
                    reverse_sql="DROP INDEX IF EXISTS users_nic_number_idx;",
                ),
                migrations.RunSQL(
                    sql="CREATE INDEX IF NOT EXISTS patients_nic_number_idx ON patients (nic_number);",
                    reverse_sql="DROP INDEX IF EXISTS patients_nic_number_idx;",
                ),
            ],
            state_operations=[
                migrations.AddField(
                    model_name="user",
                    name="nic_number",
                    field=models.CharField(blank=True, db_index=True, max_length=50, null=True),
                ),
                migrations.AddField(
                    model_name="patient",
                    name="nic_number",
                    field=models.CharField(blank=True, db_index=True, max_length=50, null=True),
                ),
            ],
        )
    ]

