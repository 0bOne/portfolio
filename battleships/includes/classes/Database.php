<?php
class Database
{
    private static $dbConnection;

    private static function checkConnect ()
    {
        if (Database::$dbConnection == NULL)
        {
            global $VCMS_DB_HOST, $VCMS_DB_NAME, $VCMS_DB_PASS, $VCMS_DB_USER, $VCMS_DB_PORT;
            Database::$dbConnection = mysqli_connect($VCMS_DB_HOST, $VCMS_DB_USER, $VCMS_DB_PASS, null ,$VCMS_DB_PORT);
            mysqli_select_db(Database::$dbConnection, $VCMS_DB_NAME);
            $sql = "SET SQL_BIG_SELECTS=1;";
            Database::insert($sql);
        }
    }

    public static function insert ($sql)
    {
        Database::checkConnect();
        mysqli_query(Database::$dbConnection, $sql);
        $ret = mysqli_insert_id(Database::$dbConnection);
        Database::showTrace($sql, 0);
        return $ret;
    }

    public static function singleQuery ($sql)
    {
        //return single record if available, false otherwise
        $ret = false;
        $results = Database::query($sql);
        if (is_array($results) && count($results) > 0)
        {
            $ret = $results[0];
        }
        return $ret;
    }

    public static function pagedQuery ($sql)
    {
        $pos = stripos($sql, "SQL_CALC_FOUND_ROWS");
        if ($pos > 0)
        {
            Trace("Database::pagedQuery() SQL_CALC_FOUND_ROWS already detected");
        } else
        {
            Trace("Database::pagedQuery() inserting SQL_CALC_FOUND_ROWS");
            $count = 1;
             $sql = str_ireplace("SELECT ", "SELECT SQL_CALC_FOUND_ROWS ", $sql, $count);
             $sql = str_ireplace("SELECTINNER ", "SELECT ", $sql, $count);          
        }
        $results = Database::query($sql);
        $sqlTotal = "SELECT FOUND_ROWS();";
        $resTotal = Database::singleQuery($sqlTotal);
        if ($resTotal)
        {
            $results['totalRows'] = $resTotal['FOUND_ROWS()'];
            Trace("Total rows found: " . $results['totalRows']);
        }
        return $results;
    }

    public static function query ($sql)
    {
        $ret = "";
    	Database::checkConnect();
        $result = mysqli_query(Database::$dbConnection, $sql);
        $count = 0;
        if ($result)
        {
            $ret = array();
            $row = @mysqli_fetch_assoc($result);
            while ($row)
            {
                array_push($ret, Database::sanitizeArray($row));
                $row = @mysqli_fetch_assoc($result);
                $count ++;
            }
            mysqli_free_result($result);
        }
        Database::showTrace($sql, $count);
        return $ret;
    }
    
    public static function queryWithRowCallback($sql, $callbackObj)
    {
        //gets query but only retrieves one row at a time
        ///and passes it to $callbackObj->returnedRowCallback($row);
        //useful in memory intensive reports 
        //returns number of records to calling function
        
        Database::checkConnect();
        Trace("Database::queryWithRowCallback -- query is $sql");
        $result = mysqli_query(Database::$dbConnection, $sql);
        $count = 0;
        
        if ($result)
        {
            $row = mysqli_fetch_assoc($result);
            //Trace("Database::queryWithRowCallback ROW -- result is " . var_export($row,true));
            while ($row)
            {
                $callbackObj->returnedRowCallback($row);
                $row = mysqli_fetch_assoc($result);
                $count ++;
            }
            mysqli_free_result($result);
        }
        
       Trace("Database::queryWithRowCallback -- query complete.  Record count was $count.");
       return  $count;
    }

    public static function sanitizeArray ($myArray)
    {
        //automatically escape quotes etc. in the _POST data
        foreach ($myArray as $key => $value)
        {
            if (is_array($myArray[$key]))
            {
                $this->sanitizePostArray($myArray[$key]);
            } else
            {
                //echo "<br>db sanitizing '$value'<br/>";
                $myArray[$key] = htmlentities($value, ENT_QUOTES, "", false);
                //echo "<br>db sanitized to '" . $myArray[$key] . "'<br/>";
            }
        }
        return $myArray;
    }

    public static function escapeString ($string)
    {
        Database::checkConnect();
        return mysqli_real_escape_string(Database::$dbConnection, $string);
    }

    private function showTrace ($sql, $rowCount)
    {
        //if (isset($_GET["showsql"])) //uncomment this line to see in-page sql queries. don't forget to put it back!
        if (FALSE) //comment out this line to see in-page sql queries. don't forget to put it back!
        {
            echo("sql: $sql<br/>");
            echo("err: " . mysqli_error(Database::$dbConnection) . "<br/>");
            echo("rows: $rowCount<br/>");
        }
    }
    
    public function lastError()
    {
        return mysqli_error(Database::$dbConnection);
    }
}

?>