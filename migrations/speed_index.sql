ALTER TABLE `WPTResult`
	ADD COLUMN `avgfirstviewspeedindex` BIGINT(20) NULL DEFAULT NULL AFTER `avgfirstviewfullyloadedbytesin`,
	ADD COLUMN `avgrepeatviewspeedindex` BIGINT(20) NULL DEFAULT NULL AFTER `avgrepeatviewfullyloadedbytesin`;
