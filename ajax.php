<?php

// error_reporting(E_ALL);
 error_reporting(0);
global $answ;
global $pfolder;
$answ = array();
putenv('PATH=/usr/local/bin:/usr/bin:/bin');

require_once('misc.php');

$projectsDir = '../projects/';

$str_json = file_get_contents('php://input');


function normalizeEncodingFromJS($str){
    return preg_replace_callback('/\\\u([a-f0-9]{4})/i', function($m){ return chr(hexdec($m[1])-1072+224); }, $str);;
}

function moreNormJsonStr($str){
    
    $str = str_replace('\\\\"',' ', $str);
    $str = str_replace('\\\\{',' ', $str);
        $str = normalizeEncodingFromJS($str);
        for ($i = 0, $j = strlen($str); $i < $j; $i++) {
            $asciicode = ord($str[$i]);
            if ($asciicode < 32)
            $str[$i] = ' ';
            else 
            if ($asciicode >126)
            $str[$i] = ' ';
        }
        
        return $str;
}


// echo normalizeEncodingFromJS("\u0420\u0459\u0420\u00b0\u0421\u0402\u0421\u201a\u0420\u00b0");

function _json_decode($str) {
    $j = json_decode($str, true);
    //     if (!$j) $j = json_decode( normalizeEncodingFromJS( $str ), true);
    //     if (!$j) $j = json_decode( moreNormJsonStr( $str ), true);
    return $j;
}

//   if (!isset($_POST['nobase64'])) $jsonstr = base64_decode( $jsonstr );

if ( strlen( $str_json ) == 0)
die('json not found');

$json = _json_decode ( $str_json );

function backupFile($backupsfolder, $pfolder, $fullname, $userename = false) {
    
    $exist = file_exists($fullname);
    
    $fileRelativeDir = str_replace( $pfolder, '', dirname($fullname));
    
    $backupfilename = $backupsfolder. $fileRelativeDir . '/' . date('dMy_H-i-s_') . basename( $fullname );
    
    $dir = dirname( $backupfilename );
    
    if (!file_exists($dir)) {
        mkdir( $dir, 0777, true );
    }
    
    //     echo "backupFile $fullname \n";
    //     echo "fileRelativeDir $fileRelativeDir \n";
    //     echo "exist $exist \n";
    //     echo "backupfilename $backupfilename \n";
    
    
    if (!$exist){
        //         echo "not exist ! \n";
        return 1;
    }
    
    if ($userename && rename($fullname, $backupfilename)) {
        return 1;
    }
    
    if (copy($fullname, $backupfilename)) {
        return 1;
    }
    
    
}


function removeNotChars($str){
    return preg_replace('/[^\w\d-]/i','', normalizeEncodingFromJS( $str ) );
}

function removeNotCharsWithDot($str){
    return preg_replace('/[^\w\d-\.]/i','', normalizeEncodingFromJS( $str ) );
}

function removeNotCharsWithDotOrBackSlash($str){
    return preg_replace('/[^\w\d-\.\/]/i','', normalizeEncodingFromJS( $str ) );
}

function dewin($s){
    $s = str_replace('//', '/', str_replace('\\', '/', $s));
    return $s;
}

function normalizePath($path) {
    return dewin( normalizeEncodingFromJS ( array_reduce(explode('/', $path), function($a, $b) {
        if($a === 0) $a = "/";
        if($b === "" || $b === ".") return $a;
        if($b === "..") return dirname($a);
        return preg_replace("/\/+/", "/", "$a/$b"); 
    }, 0) ));
}


function normalizeFileName($pfolder, $fn, $returnFn = false, $nopfolder = false ) {
    $ddbg = 0;
    $fullpath = ( $nopfolder ? "" : $pfolder ) . normalizeEncodingFromJS( $fn );
    $allowDir = dewin(str_replace(realpath( '..' ), '', realpath( $pfolder )));
    $realFullPath = normalizePath($fullpath);
    
    if ($ddbg) {
        echo "pfolder = $pfolder \n";
        echo "fullpath = $fullpath \n";
        echo "realFullPath = $realFullPath \n";
        echo "normalizeFileName $pfolder $fn $returnFn \n";
        echo "allowDir      = $allowDir \n";
        echo "realFullPath  = $realFullPath  \n";
    }
    if ( strrpos ( $realFullPath, $allowDir ) === 0 ) {
        if ($returnFn){
            $fn = str_replace( $allowDir . '/', '', $realFullPath );
            if ($ddbg) echo "return  $fn \n\n";
            if (strlen($fn) > 2) {
                return $fn;
            }
        }
        if ($ddbg) echo "return  ..$realFullPath \n\n";
        return '..' . $realFullPath;
    }
    
    if ($ddbg) echo "return 0  \n\n";
    
    
}



global $_project_json;
global $_project_json_parsed;
global $pfolder;

function publish($publishDir, $files){
    global $answ;
    global $pfolder;
    if ($publishDir) {
        
        $answ['error'] = '';
        foreach ( $files as $k => $v ) {
            if (! copy( $pfolder.$v , "$publishDir/$v") ){
                
                mkdir( dirname("$publishDir/$v"), 0777, true );
                if (! copy( $pfolder.$v , "$publishDir/$v") ){
                    $answ['error'].="can't copy $v \n";
                }
                
            }
        }
        
        if (strlen($answ['error']) == 0){
            unset( $answ['error'] );
            $answ['ok'] = 1;
            $answ['result'] = "PUBLISHED SUCCESS!";
        }
    } else {
        $answ['error'] = 'no publish dir';
    }
}



if (is_array($json)) {
    $project = @$json['project'];
    if (!$project) $project = "";
    
    $pname = preg_replace('/[^\w\d]/i', '', $project);
    
    $pfolder = $projectsDir.$pname."/";
    $realProjectFolder = $pfolder;
    
    function getProjectJson(){
        global $pfolder;
        global $_project_json;
        global $_project_json_parsed;
        
        if ($_project_json || $_project_json_parsed) return $_project_json;
        
        $_project_json_parsed = 1;
        
        $pfile = $pfolder."project.json";
        
        $_project_json = file_get_contents($pfile);
        
        if ($_project_json) {
            $_project_json = _json_decode($_project_json);
        }
        return $_project_json;
    }
    
    $backupsfolder = "../backups/$pname/";
    
    $lname = str_replace('.json', '', "".@$json['layout']);
    $lname = preg_replace('/[^\w\d\/-]/i','', $lname);
    
    if ( isset($json['command'] )){
        
        $command = @$json['command'];
        $projectDir = @$json['projectDir'];
        
        if ($projectDir) {
            $pfolder .= $projectDir;
        }
        
        if ($command == 'projectsList') {
            $answ['ok'] = 1;
            $answ['result'] = dirToArray( $projectsDir, false, true );
        }
        else 
        if ($command == 'dirlist') {
            
            if (!strlen($pname)) die();
            $answ['ok'] = 1;
            
            $pj = getProjectJson();
            $ignoreFiles = array();
            
            if ($pj) {
                $ifls = @$pj['ignoreFiles'];
                if ($ifls) {
                    foreach ($ifls as $k => $v){
                        $ignoreFiles[ $pfolder. $k ] = $v;
                    }
                }
            }
            
            $answ['result'] = dirToArray( $pfolder, true, false, false, true, $ignoreFiles );
            
            
        }
        else if ($command == "build"){
            
            $target = $json['target'];
            
            $command = "cd $realProjectFolder && node ../../eeditor/tools/builder --target=$target --log=debug";
            
            $answ['result'] = shell_exec( $command . ' 2>&1');
            $answ['ok'] = 1;
            
        }
        else if ($command == 'sync') {
            
            $answ['ok'] = 0;
            $answ['error'] = 'sync fail';
            $answ['result'] = 'sync fail';
            
            $syncDir = 0;
            $pj = getProjectJson();
            if (@$pj["build_targets"]["SYNC"]) {
                $command = "cd $realProjectFolder && node ../../eeditor/tools/builder --target=SYNC --log=debug";
                
                $answ['result'] = shell_exec( $command . ' 2>&1');
                $answ['ok'] = 1;
            } else
            if (function_exists('syncProject')) {
                $answ['ok']=1;
                $answ['result'] = syncProject($pname);
            }
             
        }
        else if ($command == 'publish') {
            $files = @$json['files'];
            if (is_array($files)) {
                
                if (function_exists('publishPath')) {
                    $publishDir = publishPath($pname);
                    if ($publishDir) {
                        publish("../$publishDir", $files);
                    }
                }
                
                if (!$publishDir){
                    $j = getProjectJson();
                    if ($j) {
                        $publishDir = @$j['publishPath'];
                        if ($publishDir){
                            publish($publishDir, $files);
                        } else {
                            
                            $i = 1;
                            while (true) {
                                $publishDir = @$j["publishPath$i"];
                                if ($publishDir){
                                    publish($publishDir, $files);
                                    if (@$answ['error']) break;
                                } else {
                                    break;
                                }
                                $i = $i + 1;
                            }
                            
                            
                            
                        }
                    }
                }
            } else {
                $answ['error'] = 'no files to publish';
            }
            
        }
        else if ($command == 'projectCreate') {
            if (is_dir($pfolder)){
                $answ['error']='project '.$pname.' already exist';
            } else {
                if (mkdir($pfolder))
                if (mkdir($pfolder.'img'))
                if (mkdir($pfolder.'layouts'))
                if (mkdir($backupsfolder)) {
                    $answ['ok'] = 1;
                    $answ['result'] = 1;
                }
            }
        }
        else if ($command == 'fileOpen') {
            
            if (!strlen($pname)) die();
            
            if (@$json['isBackup']){
                $filename = normalizeFileName($backupsfolder, @$json['file']);
            } else {
                $filename = normalizeFileName($pfolder , @$json['file']);
            }
            
            if ( $filename ) {
                
                if (file_exists($filename)) {
                    $answ['ok'] = 1;
                    $answ['result'] = file_get_contents( $filename );
                } else {
                    
                    $answ['error'] = "file $filename not exist";
                }
                
            } else {
                $answ['error'] = "normalizeFileName failed";
            }
            
        }
        else if ($command == 'filesCopy'){
            
            //TODO: normalizeFileName
            $files = $json['files'];
            $answ['error'] = '';
            $outdir = $json['outdir'];
            if (!is_dir($outdir)) {
                mkdir( $outdir, 0777, true );
            }
            foreach ( $files as $k => $v ) {
                if (!copy( $pfolder.$k , "$outdir/$v") ){
                    $answ['error'].="can't copy $k \n";
                }
            }
            
            if (strlen($answ['error']) == 0){
                $answ['ok'] = 1;
                $answ['result'] = "success";
            }
        }
        else if ($command == 'mkdir'){
            $fullpath = normalizeFileName( $pfolder, dirname( @$json['path']. '/1' ) .'/'. removeNotChars(@$json['name']) );
            if ($fullpath) {
                if (!is_dir($fullpath)) mkdir( $fullpath, 0777, true );
                $answ['ok'] = 1;
                $answ['result'] = "success $fullpath";
            }
        }
        else if ($command == 'fileRename'){
            
            $src = normalizeFileName( $pfolder, @$json['path'] );
            $canMove = @$json['canMove'];
            $dst = @$json['canMove'] ? 
                normalizeFileName( $pfolder, removeNotCharsWithDotOrBackSlash( @$json['name'] ) ) :
                normalizeFileName( $pfolder, dirname( @$json['path'] ) . "/". removeNotCharsWithDot( @$json['name'] ) );
            
            // echo "$src \n";
            // echo "$dst \n";
            // die();
            // if (!$src || !$dst) echo 11;
            // if (dirname( $src ) != dirname($dst)) echo 22;
            // if ( $src == $dst ) echo 33;
            
            if ($src && $dst && ($canMove || (dirname( $src ) == dirname($dst)) ) && ($src != $dst) ){
                
                if (!file_exists($src)) {
                    $answ['error'] = "file $src not exist";
                } else
                if (file_exists($dst)) {
                    $answ['error'] = "file $dst already exist";
                } else {
                    if ( rename($src, $dst) )
                    { 
                        $answ['ok'] = 1;
                        $answ['result'] = "success   $src -> $dst";
                    }
                }
                
            }
        }
        else if ($command == 'fileRemove'){
            
            $path = normalizeFileName( $pfolder, @$json['path'] );
            
            if ($path){
                
                if (!file_exists($path)) {
                    $answ['error'] = "file $path not exist";
                } else {
                    
                    if ( backupFile($backupsfolder, $pfolder, $path, 1) ) {
                        $answ['ok'] = 1;
                        $answ['result'] = "success $path";
                    } else {
                        $answ['error'] = 'cant create backup';
                    }
                }
                
            }
            
        }
        else if ($command == "fileWrite") {
            $fn = normalizeFileName($pfolder , @$json['file'], 1);
            if ($fn){
                
                $fullname = $pfolder . $fn;
                $dir = dirname($fullname);
                $exist = file_exists($fullname);
                
                if (!file_exists($dir)) mkdir( $dir, 0777, true );
                
                if (!backupFile($backupsfolder, $pfolder, $fullname)) {
                    $answ['error'] = "save backup error". $fn . $backupfilename;
                }
                else 
                if ( isset($json['content']) ){
                    
                    if (@$json['binary']){
                        $data = base64_decode( $json['content'], TRUE );
                    } else {
                        $data = $json['content'];
                    }
                    
                    if ( file_put_contents($fullname, $data) !== FALSE ){
                        $answ['result'] = 1;
                        $answ['ok'] = 1;
                    } else {
                        $answ['error'] = 'can not write '.$fullname;
                    }
                    
                }
                else {
                    $answ['error'] = 'can not write '.$fn.' no content';
                }
            }
            
        } else 
        if ($command == 'backupsList'){
            
            $path = normalizeFileName( $backupsfolder, @$json['path'] );
            
            $regexpStr = @$json['regexp'];
            
            $answ['ok'] = 1;
            $listAll = dirToArray($path, 0, 0, 1, 1);
            $list = array();
            if ($regexpStr){
                $regexpStr = "/$regexpStr/";
                $answ['regexp'] = $regexpStr;
                foreach ($listAll as $k => $v){
                    if (preg_match($regexpStr, $v)) {
                        $list[] = $v;
                    }
                }
            } else {
                $list = $listAll;
            }
            $answ['result'] = array(
                'path' => $path,
                'list' => $list
            );
        }
    }
    
}

if (count( $answ ) == 0) {
    
    $answ['error'] = 'unknown server error';
    
}

echo json_encode($answ);

?>
