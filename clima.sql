-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Servidor: 127.0.0.1
-- Tiempo de generación: 24-06-2026 a las 15:32:03
-- Versión del servidor: 10.4.32-MariaDB
-- Versión de PHP: 8.0.30

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de datos: `emep_tec`
--

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `clima`
--

CREATE TABLE `clima` (
  `id` int(4) NOT NULL,
  `temperatura` int(4) NOT NULL,
  `humedad` int(4) NOT NULL,
  `sensacion` int(4) NOT NULL,
  `fecha` date NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Índices para tablas volcadas
--
CREATE TABLE `dia` (
  `id` INT NOT NULL AUTO_INCREMENT ,
  `temperatura_max` DECIMAL NOT NULL ,
  `temperatura_min` DECIMAL NOT NULL ,
  `sensacion_min` DECIMAL NOT NULL ,
  `sensacion_max` DECIMAL NOT NULL ,
  `humedad_prom` FLOAT NOT NULL ,
  `fecha` DATE NOT NULL DEFAULT CURRENT_TIMESTAMP ,
  PRIMARY KEY (`id`)) ENGINE = InnoDB;
--
-- Tabla para registrar el cierre de cada semana
CREATE TABLE `semana` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `fecha_inicio` DATE NOT NULL,
  `fecha_fin` DATE NOT NULL,
  `creado_en` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE = InnoDB;

-- Tabla intermedia (Relación Muchos a Muchos o Uno a Muchos) 
-- para saber qué días pertenecen a qué semana sin romper la normalización.
CREATE TABLE `semana_dias` (
  `semana_id` INT NOT NULL,
  `dia_id` INT NOT NULL,
  PRIMARY KEY (`semana_id`, `dia_id`),
  FOREIGN KEY (`semana_id`) REFERENCES `semana`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`dia_id`) REFERENCES `dia`(`id`) ON DELETE CASCADE
) ENGINE = InnoDB;
-- Indices de la tabla `clima`
--
ALTER TABLE `clima`
  ADD PRIMARY KEY (`id`);

--
-- AUTO_INCREMENT de las tablas volcadas
--
ALTER TABLE `clima` CHANGE `fecha` `fecha` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP;
--
-- AUTO_INCREMENT de la tabla `clima`
--
ALTER TABLE `clima`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;
COMMIT;

ALTER TABLE `clima` CHANGE `temperatura` `temperatura` DECIMAL(4) NOT NULL, CHANGE `sensacion` `sensacion` DECIMAL(4) NOT NULL;



/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
