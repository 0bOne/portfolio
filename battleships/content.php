<?php
	require_once realpath('includes/globals.php');
	require_once realpath('includes/classes/Database.php');
		
	$result = ["status"=>"error"];
	
	if (isset($_GET['to']) 
			&& isset($_GET['from'])
			&& isset($_GET['action'])
			&& isset($_GET['option'])
			&& isset($_GET['data'])
			&& isset($_GET['timestamp']))
	{
		//ensure no injectables...
		$to = Database::escapeString($_GET['to']);
		$from = Database::escapeString($_GET['from']);
		$action = Database::escapeString($_GET['action']);
		$option = Database::escapeString($_GET['option']);
		$data = Database::escapeString($_GET['data']);
		$timestamp = Database::escapeString($_GET['timestamp']);
		
		if ($action == "STATUS")
		{
			$sql = "SELECT * FROM conversation WHERE `to`='$to' AND `from`='$from' AND `timestamp` > $timestamp LIMIT 1;";
			$ret = Database::singleQuery($sql);
			if (isset($ret) && isset($ret['action']))
			{
				$result = $ret;
				$result['status'] = 'OK';
			}
			else
			{
				$result['status'] = 'EMPTY';
			}			
		}
		else
		{
			//all other actions update the database
			$sql = "SELECT count(*) as count FROM conversation WHERE `to`='$to' AND `from`='$from' LIMIT 1;";
			$ret = Database::singleQuery($sql);
			if ($ret['count'] == 0)
			{
				$sql = "INSERT INTO conversation (`to`, `from`, `action`, `option`, `data`, `timestamp`) VALUES ('$to', '$from', '', '', '', CURRENT_TIMESTAMP());";
				$result['inserted'] ='true';
				//$result['sql'] = $sql;
				Database::insert($sql);
				//$result['sqlerror1'] = Database::lastError();
			}
			$sql = "UPDATE conversation SET `action`='$action', `option`='$option', `data`='$data', 
					`timestamp`= CAST(CURRENT_TIMESTAMP() as UNSIGNED)
					WHERE `to`='$to' AND `from`='$from' LIMIT 1;";
			$result['sql2'] = $sql;
			$result['updated'] ='true';
			Database::insert($sql);					
			$result['sqlerror2'] = Database::lastError();
			$result['status'] = 'OK';
		}
	}

	header("content-type: application/json");
	echo json_encode($result);