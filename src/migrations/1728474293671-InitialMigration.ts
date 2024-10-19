import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class InitialMigration1728474293671 implements MigrationInterface {
  name = 'InitialMigration1728474293671';

  async tableExists(
    queryRunner: QueryRunner,
    tableName: string,
  ): Promise<boolean> {
    const table = await queryRunner.getTable(tableName);
    return !!table;
  }

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create tables if they don't exist
    if (!(await this.tableExists(queryRunner, 'conversation'))) {
      await queryRunner.createTable(
        new Table({
          name: 'conversation',
          columns: [
            {
              name: 'id',
              type: 'int',
              isPrimary: true,
              isGenerated: true,
              generationStrategy: 'increment',
            },
            { name: 'tripId', type: 'int', isNullable: true },
            { name: 'passengerId', type: 'int', isNullable: true },
          ],
        }),
      );
    }

    if (!(await this.tableExists(queryRunner, 'message'))) {
      await queryRunner.createTable(
        new Table({
          name: 'message',
          columns: [
            {
              name: 'id',
              type: 'int',
              isPrimary: true,
              isGenerated: true,
              generationStrategy: 'increment',
            },
            { name: 'senderId', type: 'int', isNullable: true },
            { name: 'receiverId', type: 'int', isNullable: true },
            { name: 'tripId', type: 'int', isNullable: true },
            { name: 'conversationId', type: 'int', isNullable: true },
            { name: 'content', type: 'text' },
            { name: 'sentAt', type: 'datetime' },
          ],
        }),
      );
    }

    // Proceed with alterations, using IF EXISTS to avoid errors if constraints don't exist
    await queryRunner.query(
      `ALTER TABLE \`conversation\` DROP FOREIGN KEY IF EXISTS \`FK_daef7f1bd73e3c0d064bb722ed4\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`conversation\` DROP FOREIGN KEY IF EXISTS \`FK_8a3ae225db139fc426a27888db0\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`conversation\` CHANGE \`tripId\` \`tripId\` int NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`conversation\` CHANGE \`passengerId\` \`passengerId\` int NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`message\` DROP FOREIGN KEY IF EXISTS \`FK_bc096b4e18b1f9508197cd98066\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`message\` DROP FOREIGN KEY IF EXISTS \`FK_71fb36906595c602056d936fc13\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`message\` DROP FOREIGN KEY IF EXISTS \`FK_06a407f2454e79b3bdce9970b97\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`message\` DROP FOREIGN KEY IF EXISTS \`FK_7cf4a4df1f2627f72bf6231635f\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`message\` CHANGE \`senderId\` \`senderId\` int NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`message\` CHANGE \`receiverId\` \`receiverId\` int NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`message\` CHANGE \`tripId\` \`tripId\` int NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`message\` CHANGE \`conversationId\` \`conversationId\` int NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`reservation\` DROP FOREIGN KEY IF EXISTS \`FK_dbf92e47c7c35c637c118f9b34a\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`reservation\` DROP FOREIGN KEY IF EXISTS \`FK_7af236a3e025a5d024a34b15bb8\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`reservation\` CHANGE \`tripId\` \`tripId\` int NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`reservation\` CHANGE \`passengerId\` \`passengerId\` int NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`trip\` DROP FOREIGN KEY IF EXISTS \`FK_2034f2f2e58179b42c4866f6f13\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`trip\` DROP FOREIGN KEY IF EXISTS \`FK_7794de982c19fe8f4cf4460efc6\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`trip\` CHANGE \`driverId\` \`driverId\` int NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`trip\` CHANGE \`carId\` \`carId\` int NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`car\` DROP FOREIGN KEY IF EXISTS \`FK_d4e3f93ef928103f36446e17379\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`car\` CHANGE \`driverId\` \`driverId\` int NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`license\` DROP FOREIGN KEY IF EXISTS \`FK_958cc4d6f70dc93e2ce1bd6f56d\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`license\` CHANGE \`driverId\` \`driverId\` int NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`notification\` DROP FOREIGN KEY IF EXISTS \`FK_1ced25315eb974b73391fb1c81b\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`notification\` CHANGE \`relatedEntityId\` \`relatedEntityId\` int NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`notification\` CHANGE \`userId\` \`userId\` int NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`user\` DROP FOREIGN KEY IF EXISTS \`FK_c28e52f758e7bbc53828db92194\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`user\` CHANGE \`stripeUserId\` \`stripeUserId\` varchar(255) NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`user\` CHANGE \`roleId\` \`roleId\` int NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`payment\` CHANGE \`stripePaymentIntentId\` \`stripePaymentIntentId\` varchar(255) NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`conversation\` ADD CONSTRAINT \`FK_daef7f1bd73e3c0d064bb722ed4\` FOREIGN KEY (\`tripId\`) REFERENCES \`trip\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`conversation\` ADD CONSTRAINT \`FK_8a3ae225db139fc426a27888db0\` FOREIGN KEY (\`passengerId\`) REFERENCES \`user\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`message\` ADD CONSTRAINT \`FK_bc096b4e18b1f9508197cd98066\` FOREIGN KEY (\`senderId\`) REFERENCES \`user\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`message\` ADD CONSTRAINT \`FK_71fb36906595c602056d936fc13\` FOREIGN KEY (\`receiverId\`) REFERENCES \`user\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`message\` ADD CONSTRAINT \`FK_06a407f2454e79b3bdce9970b97\` FOREIGN KEY (\`tripId\`) REFERENCES \`trip\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`message\` ADD CONSTRAINT \`FK_7cf4a4df1f2627f72bf6231635f\` FOREIGN KEY (\`conversationId\`) REFERENCES \`conversation\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`reservation\` ADD CONSTRAINT \`FK_dbf92e47c7c35c637c118f9b34a\` FOREIGN KEY (\`tripId\`) REFERENCES \`trip\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`reservation\` ADD CONSTRAINT \`FK_7af236a3e025a5d024a34b15bb8\` FOREIGN KEY (\`passengerId\`) REFERENCES \`user\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`trip\` ADD CONSTRAINT \`FK_2034f2f2e58179b42c4866f6f13\` FOREIGN KEY (\`driverId\`) REFERENCES \`user\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`trip\` ADD CONSTRAINT \`FK_7794de982c19fe8f4cf4460efc6\` FOREIGN KEY (\`carId\`) REFERENCES \`car\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`car\` ADD CONSTRAINT \`FK_d4e3f93ef928103f36446e17379\` FOREIGN KEY (\`driverId\`) REFERENCES \`user\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`license\` ADD CONSTRAINT \`FK_958cc4d6f70dc93e2ce1bd6f56d\` FOREIGN KEY (\`driverId\`) REFERENCES \`user\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`notification\` ADD CONSTRAINT \`FK_1ced25315eb974b73391fb1c81b\` FOREIGN KEY (\`userId\`) REFERENCES \`user\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`user\` ADD CONSTRAINT \`FK_c28e52f758e7bbc53828db92194\` FOREIGN KEY (\`roleId\`) REFERENCES \`role\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`user\` DROP FOREIGN KEY IF EXISTS \`FK_c28e52f758e7bbc53828db92194\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`notification\` DROP FOREIGN KEY IF EXISTS \`FK_1ced25315eb974b73391fb1c81b\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`license\` DROP FOREIGN KEY IF EXISTS \`FK_958cc4d6f70dc93e2ce1bd6f56d\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`car\` DROP FOREIGN KEY IF EXISTS \`FK_d4e3f93ef928103f36446e17379\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`trip\` DROP FOREIGN KEY IF EXISTS \`FK_7794de982c19fe8f4cf4460efc6\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`trip\` DROP FOREIGN KEY IF EXISTS \`FK_2034f2f2e58179b42c4866f6f13\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`reservation\` DROP FOREIGN KEY IF EXISTS \`FK_7af236a3e025a5d024a34b15bb8\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`reservation\` DROP FOREIGN KEY IF EXISTS \`FK_dbf92e47c7c35c637c118f9b34a\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`message\` DROP FOREIGN KEY IF EXISTS \`FK_7cf4a4df1f2627f72bf6231635f\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`message\` DROP FOREIGN KEY IF EXISTS \`FK_06a407f2454e79b3bdce9970b97\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`message\` DROP FOREIGN KEY IF EXISTS \`FK_71fb36906595c602056d936fc13\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`message\` DROP FOREIGN KEY IF EXISTS \`FK_bc096b4e18b1f9508197cd98066\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`conversation\` DROP FOREIGN KEY IF EXISTS \`FK_8a3ae225db139fc426a27888db0\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`conversation\` DROP FOREIGN KEY IF EXISTS \`FK_daef7f1bd73e3c0d064bb722ed4\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`payment\` CHANGE \`stripePaymentIntentId\` \`stripePaymentIntentId\` varchar(255) NULL DEFAULT 'NULL'`,
    );
    await queryRunner.query(
      `ALTER TABLE \`user\` CHANGE \`roleId\` \`roleId\` int NULL DEFAULT 'NULL'`,
    );
    await queryRunner.query(
      `ALTER TABLE \`user\` CHANGE \`stripeUserId\` \`stripeUserId\` varchar(255) NULL DEFAULT 'NULL'`,
    );
    await queryRunner.query(
      `ALTER TABLE \`user\` ADD CONSTRAINT \`FK_c28e52f758e7bbc53828db92194\` FOREIGN KEY (\`roleId\`) REFERENCES \`role\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`notification\` CHANGE \`userId\` \`userId\` int NULL DEFAULT 'NULL'`,
    );
    await queryRunner.query(
      `ALTER TABLE \`notification\` CHANGE \`relatedEntityId\` \`relatedEntityId\` int NULL DEFAULT 'NULL'`,
    );
    await queryRunner.query(
      `ALTER TABLE \`notification\` ADD CONSTRAINT \`FK_1ced25315eb974b73391fb1c81b\` FOREIGN KEY (\`userId\`) REFERENCES \`user\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`license\` CHANGE \`driverId\` \`driverId\` int NULL DEFAULT 'NULL'`,
    );
    await queryRunner.query(
      `ALTER TABLE \`license\` ADD CONSTRAINT \`FK_958cc4d6f70dc93e2ce1bd6f56d\` FOREIGN KEY (\`driverId\`) REFERENCES \`user\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`car\` CHANGE \`driverId\` \`driverId\` int NULL DEFAULT 'NULL'`,
    );
    await queryRunner.query(
      `ALTER TABLE \`car\` ADD CONSTRAINT \`FK_d4e3f93ef928103f36446e17379\` FOREIGN KEY (\`driverId\`) REFERENCES \`user\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`trip\` CHANGE \`carId\` \`carId\` int NULL DEFAULT 'NULL'`,
    );
    await queryRunner.query(
      `ALTER TABLE \`trip\` CHANGE \`driverId\` \`driverId\` int NULL DEFAULT 'NULL'`,
    );
    await queryRunner.query(
      `ALTER TABLE \`trip\` ADD CONSTRAINT \`FK_7794de982c19fe8f4cf4460efc6\` FOREIGN KEY (\`carId\`) REFERENCES \`car\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`trip\` ADD CONSTRAINT \`FK_2034f2f2e58179b42c4866f6f13\` FOREIGN KEY (\`driverId\`) REFERENCES \`user\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`reservation\` CHANGE \`passengerId\` \`passengerId\` int NULL DEFAULT 'NULL'`,
    );
    await queryRunner.query(
      `ALTER TABLE \`reservation\` CHANGE \`tripId\` \`tripId\` int NULL DEFAULT 'NULL'`,
    );
    await queryRunner.query(
      `ALTER TABLE \`reservation\` ADD CONSTRAINT \`FK_7af236a3e025a5d024a34b15bb8\` FOREIGN KEY (\`passengerId\`) REFERENCES \`user\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`reservation\` ADD CONSTRAINT \`FK_dbf92e47c7c35c637c118f9b34a\` FOREIGN KEY (\`tripId\`) REFERENCES \`trip\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`message\` CHANGE \`conversationId\` \`conversationId\` int NULL DEFAULT 'NULL'`,
    );
    await queryRunner.query(
      `ALTER TABLE \`message\` CHANGE \`tripId\` \`tripId\` int NULL DEFAULT 'NULL'`,
    );
    await queryRunner.query(
      `ALTER TABLE \`message\` CHANGE \`receiverId\` \`receiverId\` int NULL DEFAULT 'NULL'`,
    );
    await queryRunner.query(
      `ALTER TABLE \`message\` CHANGE \`senderId\` \`senderId\` int NULL DEFAULT 'NULL'`,
    );
    await queryRunner.query(
      `ALTER TABLE \`message\` ADD CONSTRAINT \`FK_7cf4a4df1f2627f72bf6231635f\` FOREIGN KEY (\`conversationId\`) REFERENCES \`conversation\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`message\` ADD CONSTRAINT \`FK_06a407f2454e79b3bdce9970b97\` FOREIGN KEY (\`tripId\`) REFERENCES \`trip\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`message\` ADD CONSTRAINT \`FK_71fb36906595c602056d936fc13\` FOREIGN KEY (\`receiverId\`) REFERENCES \`user\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`message\` ADD CONSTRAINT \`FK_bc096b4e18b1f9508197cd98066\` FOREIGN KEY (\`senderId\`) REFERENCES \`user\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`conversation\` CHANGE \`passengerId\` \`passengerId\` int NULL DEFAULT 'NULL'`,
    );
    await queryRunner.query(
      `ALTER TABLE \`conversation\` CHANGE \`tripId\` \`tripId\` int NULL DEFAULT 'NULL'`,
    );
    await queryRunner.query(
      `ALTER TABLE \`conversation\` ADD CONSTRAINT \`FK_8a3ae225db139fc426a27888db0\` FOREIGN KEY (\`passengerId\`) REFERENCES \`user\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`conversation\` ADD CONSTRAINT \`FK_daef7f1bd73e3c0d064bb722ed4\` FOREIGN KEY (\`tripId\`) REFERENCES \`trip\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }
}
