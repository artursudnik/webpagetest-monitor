<?php
	session_start();
	echo('<!DOCTYPE html>');
?>
<html>
	<head>
	    <title>Keep alive session</title>
		<meta http-equiv="refresh" content="550" />
	</head>
	<body>
		<?php echo date('d/m/Y - H:i:s'); ?>
	</body>
</html>