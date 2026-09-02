import { MigrationInterface, QueryRunner } from "typeorm";

export class AgregarDireccionCodigoPostalYSolicitudesCambioDatos1788369013896 implements MigrationInterface {
    name = 'AgregarDireccionCodigoPostalYSolicitudesCambioDatos1788369013896'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`solicitud_cambio_datos\` (\`id_solicitud\` int NOT NULL AUTO_INCREMENT, \`id_solicitante\` int NOT NULL, \`nombre_solicitante\` varchar(255) NOT NULL, \`nombre_propuesto\` varchar(255) NULL, \`fecha_nacimiento_propuesta\` date NULL, \`documento_identidad_propuesto\` varchar(40) NULL, \`motivo\` text NOT NULL, \`estado\` enum ('pendiente', 'aprobada', 'rechazada') NOT NULL DEFAULT 'pendiente', \`id_revisor\` int NULL, \`nombre_revisor\` varchar(255) NULL, \`comentario_revision\` text NULL, \`revisada_en\` datetime NULL, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), INDEX \`IDX_solicitud_datos_estado\` (\`estado\`), INDEX \`IDX_solicitud_datos_solicitante\` (\`id_solicitante\`), PRIMARY KEY (\`id_solicitud\`)) ENGINE=InnoDB`);
        await queryRunner.query(`ALTER TABLE \`usuario\` ADD \`direccion\` varchar(255) NULL`);
        await queryRunner.query(`ALTER TABLE \`usuario\` ADD \`codigo_postal\` varchar(20) NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`usuario\` DROP COLUMN \`codigo_postal\``);
        await queryRunner.query(`ALTER TABLE \`usuario\` DROP COLUMN \`direccion\``);
        await queryRunner.query(`DROP INDEX \`IDX_solicitud_datos_solicitante\` ON \`solicitud_cambio_datos\``);
        await queryRunner.query(`DROP INDEX \`IDX_solicitud_datos_estado\` ON \`solicitud_cambio_datos\``);
        await queryRunner.query(`DROP TABLE \`solicitud_cambio_datos\``);
    }

}
