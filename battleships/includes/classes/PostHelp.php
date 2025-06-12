<?php

class PostHelp 
{
	public static function checkCredentials($user, $pass)
	{
		global $VCMS_ADMIN_USER, $VCMS_ADMIN_PASS;
		$ret = ($user == $VCMS_ADMIN_USER && $pass == $VCMS_ADMIN_PASS ) ? true: false;
		return $ret;
	}
	
	public static function doSave($workspace)
	{
		$errorMessage = "";
		$fields = ListFieldFactory::getPostCheckFields($workspace);
		
		foreach ($fields as $fieldId=>$field)
		{
			$errorMessage = PostHelp::checkField($fieldId, $field, $_POST[$fieldId] );
			if (strlen($errorMessage) > 0)
			{
				break;
			}
		}
		
		if (strlen($errorMessage) == 0 )
		{
			$sql = PostHelp::buildSaveQuery($fields);
			Database::insert($sql);

			$errorMessage = "changes saved";
		}
		
		return $errorMessage;
	}
	
	private static function buildSaveQuery($fields)
	{
		$tableName = "";
		$id = "";
		$key = "";
		$sqlFields = array();
		
		foreach ($fields as $fieldId=>$field)
		{
			$errorMessage = PostHelp::checkField($fieldId, $field, $_POST[$fieldId] );
			$value = $_POST[$fieldId];
			$type = $field['type'];
			
			if ($field['type'] == 'list')
			{
				$tableName = $value;
			}
			else if ($field['type'] == 'id')
			{
				$id = $value;
			}
			else if ($field['type'] == 'key')
			{
				$key = $value;
			}
			else if ($field['type'] == 'int')
			{
				$sqlFields[$fieldId] = intval($value);
			}
			else if ($field['type'] == 'text')
			{
				$sqlFields[$fieldId] = "'" . PostHelp::cleanMCEString($value) . "'";
				
			}
			
			$l = count($sqlFields);
			//echo "checking $fieldId with value $value  - $l<br/>";
			
		}
		
		$sql = "";
		
		if (strlen($tableName) > 0  && count($sqlFields) > 0 )
		{
			if ($id == "")
			{
				//do nothing - invalid query
				//echo "id not set<br/>";
			}
			else if ($id == "new")
			{
				//echo "building insert<br/>";
				$sql = PostHelp::buildInsertQuery($tableName, $sqlFields);
			}
			else if ($key == "")
			{
				//do nothing - invalid update query if key not discovered
				//echo "key not set<br/>";
			}
			else
			{
				//echo "building update<br/>";
				$sql = PostHelp::buildUpdateQuery($tableName, $sqlFields, $key, $id);
			}
		}
		
		return $sql;
	}
	
	private static function cleanMCEString($text)
	{
		$text = trim($text);
		//replace the tilda so we can use it as the trim character
		$text = str_ireplace('~', '<!--tilda-->', $text); 
		
		//replace leading para tag
		$text = str_ireplace('<p>', '~', $text); //replace the para start tag to trim it
		$text = ltrim($text, "~"); //trim the first paragraph mark
		$text = str_ireplace('~', '<p>', $text);  //put back the inner paragraph marks 
		//replace trailing para tag
		$text = str_ireplace('</p>', '~', $text); //replace the para start tag to trim it
		$text = rtrim($text, "~"); //trim the first paragraph mark
		$text = str_ireplace('~', '</p>', $text);  //put back the inner paragraph marks 
		//replace leading & trailing \r\n chars and any new spaces
		$text = trim($text);
		
		//put back any 'real' tildas
		$text = str_ireplace('<!--tilda-->', '~', $text);
		
		$text = Database::escapeString($text);
		
		return $text;
	}
	
	private static function buildInsertQuery($tableName, $fields)
	{
		$fieldNames = array();
		$fieldValues = array();
		foreach ($fields as $fieldName=>$fieldValue)
		{
			//echo "adding $fieldName = $fieldValue <br/>";
			array_push($fieldNames, $fieldName);
			array_push($fieldValues, $fieldValue);
		}
		
		$sql = "INSERT INTO `$tableName`" . 
				"(" . implode(", ", $fieldNames) . ") " . 
				"VALUES" . 
				"(" . implode(", ", $fieldValues) . "); "; 
				
		return $sql;
				
	}
	
	private static function buildUpdateQuery($tableName, $fields, $key, $id)
	{
		$setParts = array();

		foreach ($fields as $fieldName=>$fieldValue)
		{
			$setPart = "`$fieldName` = $fieldValue";  //no single quotes around value - already inserted for text strings.
			array_push($setParts, $setPart);
		}
		
		$sql = "UPDATE `$tableName` " . 
				"SET " . implode(", ", $setParts) . 
				"WHERE `$key` = $id LIMIT 1; ";
		
		return $sql;
	}
	
	
	private static function checkField($fieldId, $field, $value)
	{
	
		$max = $field['max'];
		$errorMessage = "";
		
		if ($field['type'] == 'list')
		{
			if (ListFieldFactory::isValidListName($value) == false)
			{
				$errorMessage = "Invalid list name '$value' for field '$fieldId' ";
			}
		}
		else if ($field['type'] == 'id')
		{
			if (is_numeric($value) == false)
			{
				if ($value != "new")
				{
					$errorMessage = "Invalid value specified for id";
				}
			}
		}
		else if ($field['type'] == 'key')
		{
			if (strlen($value) > $max)
			{
				$l = strlen($value);
				$errorMessage = "String too long for key. Length is $l. Maximum is $max";
			}
		}		
		else if ($field['type'] == 'int')
		{
			if (is_numeric($value) == false)
			{
				$errorMessage = "Integer expected for field '$fieldId' ";
			}
		}
		else if ($field['type'] == 'text')
		{
			if (strlen($value) > $max)
			{
				$l = strlen($value);
				$errorMessage = "String too long for field '$fieldId'. Length is $l. Maximum is $max";
			}
		}
		else
		{
			$errorMessage = "Field '$fieldId' had unexpected type '$type' ";
		}
		
		return $errorMessage;
			
	}
	
	
	public static function doDelete()
	{
		$id = $_POST['id'];
		$key = $_POST['key'];
		$list = $_POST['list'];
		
		$sql = "DELETE FROM `$list` WHERE `$key` = $id LIMIT 1; ";
		//echo "sql is $sql <br/>";
		Database::insert($sql);
		
		return "$list item deleted";
	}
	
	public static function ProcessMessage()
	{
		$message = $_POST['inputMessage'];
		
		$name = $_POST['inputName'];
		$company = $_POST['inputCompany'];

		$street = $_POST['inputStreet'];
		$suite = $_POST['inputSuite'];		
		$city = $_POST['inputCity'];
		$state = $_POST['inputState'];
		$zip = $_POST['inputZip'];
		$phone = $_POST['inputPhone'];
		$email = $_POST['inputEmail'];
		
		if (strlen($email) > 0)
		{
			$msgBody = "From: $name\r\n" .
			"Company: $company\r\n" .
			"Phone: $phone\r\n" .
			"Email: $email\r\n\r\n".
			"Message Reads:\r\n" .
			"$message\r\n\r\n" .
			"Address:\r\n" .
			"$street\r\n" .
			"$suite\r\n" .
			"$city\r\n" .
			"$state $zip\r\n";
			
			$msgSubject = "Message from a Narragansett website visitor";
			
			global $VCMS_SMTP_HOST, $VCMS_SMTP_USER, $VCMS_SMTP_PASS, $VCMS_MAIL_TO1, $VCMS_MAIL_TO2;
			
			$m = new Mail($VCMS_SMTP_HOST, "", $VCMS_SMTP_USER, $VCMS_SMTP_PASS);
						
			$result = $m->send($email, $VCMS_MAIL_TO1, $msgSubject, $msgBody);			
			//echo $result. "<br/>";
			
			$msgBody = "Mail Copy: \n" . $msgBody;
			$result = $m->send($email, $VCMS_MAIL_TO2, $msgSubject, $msgBody);
			//echo $result . "<br/>";
			
		}
	
	}
	
//posted on delete
//action: delete
//id: 5
//key: idnews
//list:news
	
//posted on save...
//action: save
//dateposted: 04/20/2009
//details:	Welcome to our new website. The site has been redesign to conform to modern web standards and to be more
// user-friendly. The new site is easy to navigate by means of buttons at the top of each page and (in
// some cases) down the left side as well. The work was a collaboration between the Narragansett Indian
// Tribe and Viforce, Inc., of Boca Raton Florida. We hope you enjoy the many features available here.
//displayorder: 1000
//id: 1 (or 'new')
//list: news
//summary: Welcome to Our New Website

}

?>