<?php

//global settings
require_once realpath('./includes/globals.php');

//this include manages the session class between pages, creating, clearing and saving as necessary.
require_once realpath('./includes/classes/Session.php');

//this include provides database access.
require_once realpath('./includes/classes/Database.php');

//these includes provide  helper functions .
require_once realpath('./includes/classes/ListFieldFactory.php');
require_once realpath('./includes/classes/MenuHelp.php');
require_once realpath('./includes/classes/PostHelp.php');
require_once realpath('./includes/classes/ContentHelp.php');

class Page
{
	
	public $sess;

	public function Page()
	{		
		session_start();
	
		global $VCMS_SESSION_NAME;
				
		if (isset($_GET['clearsession']) )
		{
			//clearession (eg ?clearsession=true) query string found,,destroy the session.
			unset ($_SESSION[$VCMS_SESSION_NAME]);
			header("Location: admin.php") ;
		}
	
		if (isset($_SESSION[$VCMS_SESSION_NAME]))
		{
			//session object exists in the session variables, get it.
			$this->sess = $_SESSION[$VCMS_SESSION_NAME];
		}
		else
		{
			//session does not exist, create it and save to session variables
			$this->sess = new Session();
			$_SESSION[$VCMS_SESSION_NAME] = $this->sess;
		}	
		
		$this->setParams();
		
	}
	
	
	
}

?>