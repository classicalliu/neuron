import {MigrationInterface, QueryRunner} from "typeorm";

export class AddIsImportToAddress1566210700613 implements MigrationInterface {

  public async up(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(`ALTER TABLE 'address' ADD COLUMN 'isImport' boolean NOT NULL DEFAULT true;`)
  }

  public async down(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.dropColumn('address', 'isImport')
  }

}
