<?php

class ContentHelp 
{
	
	private static $lastDepartment = "";
	
	public static function getContent($contentType)
	{
		
		if ($contentType == 'homeNews')
		{
			ContentHelp::displayHomeNews();
		}
		else if ($contentType == 'homeEvents')
		{
			ContentHelp::displayHomeEvents();
		}
		else if ($contentType == 'newsNews')
		{
			ContentHelp::displayNewsNews();
		}
		else if ($contentType == 'newsEvents')
		{
			ContentHelp::displayNewsEvents();
		}
		else if ($contentType == 'newsSocial')
		{
			ContentHelp::displayNewsSocial();
		}
		else if ($contentType == 'newsJobs')
		{
			ContentHelp::displayNewsJobs();	
		}
		else if ($contentType == 'contacts')
		{
			ContentHelp::checkCSS('directory');
			ContentHelp::displayAllContacts();
		}
	}
	
	private static function checkCSS($sheet)
	{
		//include stylesheet if get found
		if (isset($_GET['css']))
		{
			echo "<link href='css/$sheet.css' rel='stylesheet' type='text/css' />";
		}
	}
	
	private static function displayHomeNews()
	{
		$sql = "SELECT * FROM `news` ORDER BY `displayorder` LIMIT 3; ";
		$results = Database::query($sql);
		
		echo "
				<div id='txt_title_news' >Tribal News</div>
				<div id='title_news' title='Tribal News' ></div>
			";
		
		if (is_array($results) && count($results) > 0)
		{
			$count = 1;
			foreach ($results as $result)
			{
				$headline = $result['summary'];
				$posted =$result['dateposted'];
				echo "
					<div id='txt_news_headline$count' >$headline</div>
					<div id='txt_news_date$count' >$posted</div>
				";
				$count++;
			}
		}
	}
	
	private static function displayHomeEvents()
	{
		$sql = "SELECT * FROM `events` ORDER BY `displayorder` LIMIT 2; ";
		$results = Database::query($sql);
		
		echo "
				<div id='txt_title_events'>Upcoming Events</div>
				<div id='title_events' title='Upcoming Events'></div>
			";
		
		if (is_array($results) && count($results) > 0)
		{
			$count = 1;
			foreach ($results as $result)
			{
				$headline = $result['summary'];
				$posted =$result['dateposted'];
				echo "
					<div id='txt_events_headline$count' >$headline</div>
					<div id='txt_events_date$count' >$posted</div>
				";
				$count++;
			}
		}
	}
	
	private static function displayNewsNews()
	{
		$sql = "SELECT * FROM `news` ORDER BY `displayorder`; ";
		$results = Database::query($sql);
		
		echo "
		<h3 class='subheading' id='txt_sub_news'>
			<a id='news'>Newsletter</a>
			<a href='#top' class='backToTopLink'>(back to top)</a>
		</h3>
		";
		
		if (is_array($results) && count($results) > 0)
		{
			$count = 1;
			foreach ($results as $result)
			{
				$headline = $result['summary'];
				$posted = $result['dateposted'];
				$details = html_entity_decode($result['details']); 
				echo "
					<div class='viforceRecord' id='newsArticle$count'>
						<div class='viforceField articleTitle' id='newsArticle$countTitle'>$headline</div>				
						<div class='viforceField articleDate' id='newsArticle$countDate'>$posted</div>
						<div class='viforceField articleBody' id='newsArticle$countHeadline' >
							$details
						</div>
					</div>					
				";
				$count++;
			}
		}
		else
		{
			echo "
				<div class='viforceRecord' id='newsArticle1'>
					<div class='viforceField articleDate' id='newsArticle1'>There is no news at this time.</div>
				</div>					
				";
		}				
	}
	
	private static function displayNewsEvents()
	{
		$sql = "SELECT * FROM `events` ORDER BY `displayorder`; ";
		$results = Database::query($sql);
		
		echo "
		<h3 class='subheading' id='txt_sub_events'>
			<a id='events'>Events</a>
			<a href='#top' class='backToTopLink'>(back to top)</a>
		</h3>
		";
		
		if (is_array($results) && count($results) > 0)
		{
			$count = 1;
			foreach ($results as $result)
			{
				$headline = $result['summary'];
				$posted = $result['dateposted'];
				$details = html_entity_decode($result['details']); 
				echo "
					<div class='viforceRecord' id='eventArticle$count'>
						<div class='viforceField articleTitle' id='eventArticle$countTitle'>$headline</div>				
						<div class='viforceField articleDate' id='eventArticle$countDate'>$posted</div>
						<div class='viforceField articleBody' id='eventArticle$countHeadline' >
							$details
						</div>
					</div>					
				";
				$count++;
			}
		}
		else
		{
			echo "
				<div class='viforceRecord' id='eventArticle1'>
					<div class='viforceField articleDate' id='eventArticle1'>There are no events listed at this time</div>
				</div>					
				";
		}		
	}
	
	private static function displayNewsSocial()
	{
		$sql = "SELECT * FROM `social` ORDER BY `displayorder`; ";
		$results = Database::query($sql);
		
		echo "
		<h3 class='subheading' id='txt_sub_social'>
			<a id='social'>Powwows and Socials</a>
			<a href='#top' class='backToTopLink'>(back to top)</a>
		</h3>
		";
		
		if (is_array($results) && count($results) > 0)
		{
			$count = 1;
			foreach ($results as $result)
			{
				$headline = $result['summary'];
				$posted = $result['dateposted'];
				$details = html_entity_decode($result['details']); 
				echo "
					<div class='viforceRecord' id='socialArticle$count'>
						<div class='viforceField articleTitle' id='socialArticle$countTitle'>$headline</div>				
						<div class='viforceField articleDate' id='socialArticle$countDate'>$posted</div>
						<div class='viforceField articleBody' id='socialArticle$countHeadline' >
							$details
						</div>
					</div>					
				";
				$count++;
			}
		}
		else
		{
			echo "
				<div class='viforceRecord' id='socialArticle1'>
					<div class='viforceField articleDate' id='socialArticle1'>There are no socials listed at this time</div>
				</div>					
				";
		}		
	}
	
		
	private static function displayNewsJobs()
	{
		$sql = "SELECT * FROM `jobs` ORDER BY `displayorder`; ";
		$results = Database::query($sql);
		
		echo "
		<h3 class='subheading' id='txt_sub_jobs'>
			<a id='jobs'>Jobs</a>
			<a href='#top' class='backToTopLink'>(back to top)</a>
		</h3>
		";
		
		if (is_array($results) && count($results) > 0)
		{
			$count = 1;
			foreach ($results as $result)
			{
				$headline = $result['summary'];
				$posted = $result['dateposted'];
				$details = html_entity_decode($result['details']); 
				echo "
					<div class='viforceRecord' id='jobsArticle$count'>
						<div class='viforceField articleTitle' id='jobsArticle$countTitle'>$headline</div>				
						<div class='viforceField articleDate' id='jobsArticle$countDate'>$posted</div>
						<div class='viforceField articleBody' id='jobsArticle$countHeadline' >
							$details
						</div>
					</div>					
				";
				$count++;
			}
		}
		else
		{
			echo "
				<div class='viforceRecord' id='jobsArticle1'>
					<div class='viforceField articleDate' id='jobsArticle1'>There are no jobs posted at this time</div>
				</div>					
				";
		}
	}
	
	
	private static function displayAllContacts()
	{
		$sql = "SELECT * FROM `contacts` ORDER BY `displayorder`; ";
		$results = Database::query($sql);
		
		echo 
		"
			<table id='tableBody' cellpadding='0' cellspacing='0' summary='directory of departments, names, titles, and phone numbers' >
				<thead style='display: table-header-group;' >	
					<tr class='printOnly' >
						<th class='cellHeading' >Department</th>
						<th class='cellHeading' >Contact</th>
						<th class='cellHeading' >Title</th>
						<th class='cellHeadingRight' >Phone (401)</th>
					</tr>
				</thead>
				<tbody>
		";
		
		if (is_array($results) && count($results) > 0)
		{
			$count = 1;
			$lastResult = NULL;
			
			//show the last result as current and the current as next, so that we can predict the next result
			foreach ($results as $result)
			{
				if ($lastResult != NULL)
				{
					ContentHelp::showResult($lastResult, $result);
				}
				
				$lastResult = $result;
			}
			
			ContentHelp::showResult($lastResult, NULL);
		}		

		echo "
				</tbody>
			</table>
		";		
		
	}
	
	private static function showResult($result, $nextResult)
	{
		$dept = $result['department'];
		$contact = $result['contact'];
		$title = $result['title'];
		$phone = $result['phone'];
		
		$nextDept = $nextResult['department'];
		$class = ($nextDept == $dept) ? "cellBodyLeftNoBorder" : "cellBodyLeft"; //set to no border if next dept is same
		
		$displayDept = ($dept == ContentHelp::$lastDepartment) ? "&nbsp;" : $dept; //set dept to space if same as last

		ContentHelp::$lastDepartment = $dept;
		
		
		$displayDept = ContentHelp::textToHTML($displayDept);
		$contact = ContentHelp::textToHTML($contact);
		$title = ContentHelp::textToHTML($title);
		$phone = ContentHelp::textToHTML($phone);
		
		echo 
		"
		<tr>
			<td class='$class' >$displayDept</td>
			<td class='cellBody' >$contact</td>
			<td class='cellBody' >$title</td>
			<td class='cellBodyRight' >$phone</td>
		</tr>
		";
	}
	
	private static function textToHTML($text)
	{
		if (strlen($text) == 0)
		{
			$text = "&nbsp;";
		}
		$text = str_replace("/r/n", "<br/>", $text);
		return $text;
		
	}
	
}

?>