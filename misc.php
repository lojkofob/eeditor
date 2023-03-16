<?php

if (file_exists('../local.php'))
	require_once('../local.php');

	
 
function forceFilePutContents ($filepath, $data){
    try {
        $isInFolder = preg_match("/^(.*)\/([^\/]+)$/", $filepath, $filepathMatches);
        if($isInFolder) {
            $folderName = $filepathMatches[1];
            $fileName = $filepathMatches[2];
            if (!is_dir($folderName)) {
                mkdir($folderName, 0777, true);
            }
        }
        return file_put_contents($filepath, $data);
    } catch (Exception $e) {
        echo "ERR: error writing '$data' to '$filepath', ". $e->getMessage();
    }
    
}

function startsWith($haystack, $needle)
{
     $length = strlen($needle);
     return (substr($haystack, 0, $length) === $needle);
}

function endsWith($haystack, $needle)
{
    $length = strlen($needle);
    if ($length == 0) {
        return true;
    }

    return (substr($haystack, -$length) === $needle);
}


global $ddd;
$ddd = 0;
	
function dirToArray($dir, $recursive = false, $onlyDirs = false, $onlyFiles = false, $skipHidden = false, $ignoreFiles = false, $ignoreFilesByRegExp = false) { 
   $result = array(); 
   global $ddd;
   $ddd = $ddd + 1;
//    if ($ddd > 1000)
//    return $result;

   if (!is_dir($dir))
        return $result;
        
   if (!endsWith($dir, DIRECTORY_SEPARATOR)){
        $dir .= DIRECTORY_SEPARATOR;
   }

   $cdir = scandir($dir);
   
   if ($recursive) {
        //TODO: exclude infinity symlinks
        foreach ($cdir as $key => $value) {
    
            if (!in_array($value,array(".",".."))) {
        
                if ($skipHidden && $value[0]=='.')
                    continue;
                
                $subdir = $dir . $value;
                
                if ($ignoreFiles && @$ignoreFiles[$subdir]) {
                    if (is_string( $ignoreFiles[$subdir] ) ){
                        $ignoreFilesByRegExp = $ignoreFiles[$subdir];
                    } else {
                        continue;
                    }
                }
                
                if ($ignoreFilesByRegExp && preg_match( $ignoreFilesByRegExp, $value)){
                    continue;
                }
                
                if (is_dir($subdir)) {
                    $result[$value] = dirToArray($subdir, $recursive, $onlyDirs, $onlyFiles, $skipHidden, $ignoreFiles, $ignoreFilesByRegExp); 
                }
                else 
                if (!$onlyDirs) {
                    $result[] = $value;
                }
                
            }
        }            
    }
    else 
    foreach ($cdir as $key => $value) 
    if (!in_array($value, array(".",".."))) {
    
        if ($skipHidden && $value[0]=='.')
            continue;
            
        $subdir = $dir . $value;
        
        if ($ignoreFiles && @$ignoreFiles[$subdir])
            continue;
        
        if ($ignoreFilesByRegExp && preg_match($ignoreFilesByRegExp, $value))
            continue;
        
        if ($onlyDirs && (!is_dir($subdir)))
            continue;
            
        if ($onlyFiles && (!is_file($subdir)))
            continue;
            
        $result[] = $value;
    }
   
   return $result; 
} 




function editorScripts($rand = ""){
    $result = [];
    $main = dirToArray('editor/', 0, 0, 1);
    foreach ($main as $v) {
        $result[] = "editor/$v$rand";
    }
        
    $behaviours = dirToArray('editor/behaviours', 0, 0, 1);
    
    foreach ($behaviours as $v){
        $result[] = "editor/behaviours/$v$rand";
    }
        
    return $result;
}
	
	

function editorShaders($rand = ""){
    $result = [];
    $main = dirToArray('shaders/', 0, 0, 1);
    foreach ($main as $v) {
        if (preg_match( '/\\.[fpv]/',$v)) {
            $result[] = "shaders/$v$rand";
        }
    }
        
    return $result;
}
	
?>
