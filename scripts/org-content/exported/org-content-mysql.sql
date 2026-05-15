-- MySQL dump 10.13  Distrib 8.0.43, for Win64 (x86_64)
--
-- Host: localhost    Database: fundamental_db2
-- ------------------------------------------------------
-- Server version	8.0.43

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Dumping data for table `organization_detail`
--

LOCK TABLES `organization_detail` WRITE;
/*!40000 ALTER TABLE `organization_detail` DISABLE KEYS */;
INSERT INTO `organization_detail` (`id`, `org_address`, `org_email`, `org_logo`, `org_name`, `org_phone`, `navbar_hidden_paths_json`) VALUES (1,'Bstceh Busiiness Tower,\nA 820, Sec 66,\nMohali','bedi.jaspreet@outlook.com','OrgData/HomePage/images/logo_1.svg','Seasec Pvt Ltd','08588870512','[]');
/*!40000 ALTER TABLE `organization_detail` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `organization_addresses`
--

LOCK TABLES `organization_addresses` WRITE;
/*!40000 ALTER TABLE `organization_addresses` DISABLE KEYS */;
INSERT INTO `organization_addresses` (`organization_id`, `address`, `label`) VALUES (1,'Bstceh Busiiness Tower,\nA 820, Sec 66,\nMohali','Primary Office'),(1,'Meddallion,\n476-477, 4th Floor\nSec 68, Mohali','Secondary Office');
/*!40000 ALTER TABLE `organization_addresses` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `org_about_us`
--

LOCK TABLES `org_about_us` WRITE;
/*!40000 ALTER TABLE `org_about_us` DISABLE KEYS */;
INSERT INTO `org_about_us` (`id`, `about_wallpaper`, `mission`, `org_values`, `vision`, `organization_id`) VALUES (1,NULL,'','','',1);
/*!40000 ALTER TABLE `org_about_us` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `about_image_template`
--

LOCK TABLES `about_image_template` WRITE;
/*!40000 ALTER TABLE `about_image_template` DISABLE KEYS */;
/*!40000 ALTER TABLE `about_image_template` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `org_director_detail`
--

LOCK TABLES `org_director_detail` WRITE;
/*!40000 ALTER TABLE `org_director_detail` DISABLE KEYS */;
INSERT INTO `org_director_detail` (`id`, `about_director`, `director_image`, `director_name`, `role`, `organization_id`, `social_url`) VALUES (1,'Earlier, Mr Jaspreet began his career as a Software Engineer in India and subsequently transferred to Europe and Australia as a Security Consultant. He established Seasec in 2020 from a small home setup. The company now boasts a well-established team across India and Europe and conducts its operations from self-owned offices in Mohali.\n\nAlongside his responsibilities in Security Consultancy services in Europe, Mr. Jaspreet is establishing new business ventures.\n\nHis latest initiative is Edukify—a subscription platform for training institutions that combines a branded learner portal with staff-side catalog governance so institutes can run a serious web presence without building software from scratch.\n\nHe has been instrumental in shaping Edukify—not only as the initiative’s vision holder but also through direct involvement across delivery: solution architecture, business analysis, project leadership, and creative direction, working closely with Seasec’s team to turn the product into reality.','OrgData/Owner/images/Owner_Image_752de3f7-7811-4743-908c-a66a3f5fe4fd_1.jpg','Jaspreet Bedi','',1,'https://www.instagram.com/jsbedi95?igsh=MWo4M2E3ZjVsaG93Zg%3D%3D&utm_source=qr');
/*!40000 ALTER TABLE `org_director_detail` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `org_director_detail_owner_images`
--

LOCK TABLES `org_director_detail_owner_images` WRITE;
/*!40000 ALTER TABLE `org_director_detail_owner_images` DISABLE KEYS */;
INSERT INTO `org_director_detail_owner_images` (`org_director_detail_id`, `owner_images`) VALUES (1,'OrgData/Owner/images/Owner_Image_8ac5354c-1f24-4302-af97-7b360e20d20f_1.jpg'),(1,'OrgData/Owner/images/Owner_Image_752de3f7-7811-4743-908c-a66a3f5fe4fd_1.jpg');
/*!40000 ALTER TABLE `org_director_detail_owner_images` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `org_parent_company`
--

LOCK TABLES `org_parent_company` WRITE;
/*!40000 ALTER TABLE `org_parent_company` DISABLE KEYS */;
INSERT INTO `org_parent_company` (`id`, `description`, `name`, `website_url`, `organization_id`) VALUES (1,'Seasec Pvt Ltd is the parent company behind Edukify. It carries product strategy, engineering, and long-term investment in the platform so schools, coaching brands, and training businesses get a stable partner—not a one-off project or anonymous vendor. The company focuses on practical software for education and training: secure operations, clear governance, and delivery you can run year after year.','Seasec Pvt Ltd','https://seasec.in/',1);
/*!40000 ALTER TABLE `org_parent_company` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `org_achievement`
--

LOCK TABLES `org_achievement` WRITE;
/*!40000 ALTER TABLE `org_achievement` DISABLE KEYS */;
INSERT INTO `org_achievement` (`id`, `achivement_title`, `organization_id`) VALUES (1,'',1);
/*!40000 ALTER TABLE `org_achievement` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `achievement_images`
--

LOCK TABLES `achievement_images` WRITE;
/*!40000 ALTER TABLE `achievement_images` DISABLE KEYS */;
/*!40000 ALTER TABLE `achievement_images` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `org_gallery`
--

LOCK TABLES `org_gallery` WRITE;
/*!40000 ALTER TABLE `org_gallery` DISABLE KEYS */;
INSERT INTO `org_gallery` (`id`, `gallery_title`, `organization_id`) VALUES (1,'',1);
/*!40000 ALTER TABLE `org_gallery` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `gallery_images`
--

LOCK TABLES `gallery_images` WRITE;
/*!40000 ALTER TABLE `gallery_images` DISABLE KEYS */;
/*!40000 ALTER TABLE `gallery_images` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `org_team_gallery`
--

LOCK TABLES `org_team_gallery` WRITE;
/*!40000 ALTER TABLE `org_team_gallery` DISABLE KEYS */;
INSERT INTO `org_team_gallery` (`id`, `team_section_title`, `organization_id`) VALUES (1,NULL,1);
/*!40000 ALTER TABLE `org_team_gallery` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `team_gallery_images`
--

LOCK TABLES `team_gallery_images` WRITE;
/*!40000 ALTER TABLE `team_gallery_images` DISABLE KEYS */;
INSERT INTO `team_gallery_images` (`team_gallery_id`, `image_path`) VALUES (1,'OrgData/Team/images/Team_Image_1.jpeg'),(1,'OrgData/Team/images/Team_Image_4.jpeg'),(1,'OrgData/Team/images/Team_Image_5.jpg'),(1,'OrgData/Team/images/Team_Image_6.jpeg'),(1,'OrgData/Team/images/Team_Image_7.jpg'),(1,'OrgData/Team/images/Team_Image_8.jpeg'),(1,'OrgData/Team/images/Team_Image_9.jpeg');
/*!40000 ALTER TABLE `team_gallery_images` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `home_page`
--

LOCK TABLES `home_page` WRITE;
/*!40000 ALTER TABLE `home_page` DISABLE KEYS */;
INSERT INTO `home_page` (`id`, `notes_department_type`, `all_courses`, `banner_video`, `comphrensive_heading`, `complete_course`, `complete_heading`, `department_type`, `note_course`, `notes_heading`, `terms_and_conditions`, `trending_course_heading`, `video_course`, `video_heading`, `organization_id`, `home_hero_subtitle`, `home_hero_title`, `home_offerings_intro`, `home_trust_strip`) VALUES (1,NULL,NULL,'OrgData/HomePage/animations/Homepage_Banner_Video_1.mp4',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,1,'','','','');
/*!40000 ALTER TABLE `home_page` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `home_image`
--

LOCK TABLES `home_image` WRITE;
/*!40000 ALTER TABLE `home_image` DISABLE KEYS */;
/*!40000 ALTER TABLE `home_image` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `home_video`
--

LOCK TABLES `home_video` WRITE;
/*!40000 ALTER TABLE `home_video` DISABLE KEYS */;
/*!40000 ALTER TABLE `home_video` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-05-15 13:22:40
