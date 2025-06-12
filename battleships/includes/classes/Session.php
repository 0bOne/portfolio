<?php

class Session
{
	public $isAdmin;
	public $sessionId;
	
	public $currentWorkspace;
	public $id;
	public $displayOrder;
	
	public function Session()
	{
		$this->sessionId = uniqid();
	}
	
}

?>