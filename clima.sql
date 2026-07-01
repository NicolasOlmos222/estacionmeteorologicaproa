DROP TABLE IF EXISTS `semana_dias`;
DROP TABLE IF EXISTS `semana`;
DROP TABLE IF EXISTS `dia`;
DROP TABLE IF EXISTS `clima`;

CREATE TABLE `clima` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `temperatura` DECIMAL(4,2) NOT NULL,
  `humedad` DECIMAL(4,2) NOT NULL,
  `sensacion` DECIMAL(4,2) NOT NULL,
  `lluvia` TINYINT(1) NOT NULL,
  `lluvia_mm` DECIMAL(6,2) NOT NULL,
  `velocidad_viento` DECIMAL(5,2) DEFAULT 0.00, -- Solo conservamos la velocidad
  `fecha` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `dia` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `temperatura_max` DECIMAL(4,2) NOT NULL,
  `temperatura_min` DECIMAL(4,2) NOT NULL,
  `sensacion_max` DECIMAL(4,2) NOT NULL,
  `sensacion_min` DECIMAL(4,2) NOT NULL,
  `humedad_prom` FLOAT NOT NULL,
  `fecha` DATE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB;

CREATE TABLE `semana` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `fecha_inicio` DATE NOT NULL,
  `fecha_fin` DATE NOT NULL,
  `creado_en` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB;

CREATE TABLE `semana_dias` (
  `semana_id` INT NOT NULL,
  `dia_id` INT NOT NULL,
  PRIMARY KEY (`semana_id`, `dia_id`),
  FOREIGN KEY (`semana_id`) REFERENCES `semana`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`dia_id`) REFERENCES `dia`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB;

ALTER TABLE `clima` ADD COLUMN `luz` INT DEFAULT 0 AFTER `velocidad_viento`;