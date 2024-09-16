<?php

require_once('misc.php');


$disableCache = 0;

if (isset($_GET['editorScripts'])){
    $r = editorScripts();
    $r[] = "css/editor.css";
    echo json_encode( $r );
    die();
}

if (isset($_GET['editorShaders'])){
    echo json_encode( editorShaders() );
    die();
}

if (isset($_GET['disableCache']) && intval( $_GET['disableCache'] ) == 0 )
$disableCache = false;


$rand=$disableCache ? '?t='.time() : '';

?><html>
<head>
<title>Редактор с котятками</title>
<link rel='shortcut icon' type='image/x-icon' href = 'favicon.ico'>

<meta http-equiv='cache-control' content='no-cache'>
<meta http-equiv='expires' content='0'>

<meta http-equiv="content-type" content="text/html; charset=utf-8">
<meta name="viewport" content="width=device-width, user-scalable=no, minimum-scale=1.0, maximum-scale=1.0, initial-scale:1.0">

<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="mobile-web-app-capable" content="yes">  

<?php

$enginepath = function_exists('enginePath') ? enginePath() : 'engine/';

$enginescripts = array(
    "3rdparty/es6-shim",
    "3rdparty/bowser",
    "3rdparty/howler.core",
    "3rdparty/dragonBones",
    "3rdparty/spine-webgl",
    "3rdparty/CubismSdk/Core/live2dcubismcore.min",
    "3rdparty/psd",

    // unzipping
    "3rdparty/fflate.min",
    
    "globals",
    "bus",
    "wfont",
    "basicTypes",
    "renderer",
    "object3d",
    "camera",
    "events",
    "sound",
    "node",
    "engine",
    "tweens",
    "html",
    "dragonBonesFactory",
    "spineFactory",
    "cubismFactory",
    
    "lottieFactory",
    "3rdparty/lottie-player",
    
    "shadow",
    "particles",
    "loadtasks",
    "localization",
    "text",
    "timer",

    "3d/types",
    "3d/3d",
    "3d/FBXLoader",
    "3d/shaders"

);


foreach ($enginescripts as $v)
echo "<script src='$enginepath$v.js$rand'></script>\n";


$escripts = editorScripts($rand);

foreach ($escripts as $v) {
    echo "<script src='$v'></script>\n";
}


function dirToJSArray($dir, $pm){
    echo "[";
    $dir = dirToArray( $dir ); $zpt = ''; 
    foreach ($dir as $v) { 
        if (preg_match($pm,$v)) {
            echo $zpt."'$v'"; $zpt = ','; 
        }
    } 
    echo "]";
};


function dirToJSArrayContent($bdir, $pm){
    $dir = dirToArray( $bdir );
    $content = array();
    foreach ($dir as $v) {
        if (preg_match($pm,$v)) {
            $content[$v] = file_get_contents("$bdir/$v");
        }
    }
    return json_encode($content);
};

?>

<link rel="stylesheet" href="css/editor.css"/>

</head>
<body>
<div id='gameDiv' style='position:absolute; left:0; top:0;'></div>
<script>

Editor.setOpts( {
    shadersList:<?php dirToJSArray('./shaders', '/\\.[fpv]/') ?>,
    shaders: <?php echo dirToJSArrayContent('./shaders', '/\\.[fpv]/') ?>
} )
.createView();


</script>

</body>
</html>
