<html lang="fr">
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link href="css/bootstrap.css" rel="stylesheet">
    <link href="css/bootstrap-responsive.css" rel="stylesheet">
    <link href="css/font-awesome.css" rel="stylesheet">
    <link href="css/chosen.css" rel="stylesheet">
    <link href="css/select2.min.css" rel="stylesheet">
    <link href="css/select2-bootstrap.css" rel="stylesheet">
    <link href="css/jqtree.css" rel="stylesheet">
    <link href="css/application.css" rel="stylesheet">
    <title>GEDi: Connexion</title>
</head>
<body class="login">
<div class="navbar navbar-inverse navbar-fixed-top">
    <div class="navbar-inner">
        <div class="container-fluid">
            <a class="brand" href="form_login.php">GEDi</a>
        </div>
    </div>
</div>
<div class="container-fluid">
    <div class="row-fluid">
        <legend>Code de vérification</legend>
        <div class="well">
            <form class="form-horizontal" action="test.php" method="post" enctype="multipart/form-data" name="form" id="form">
                <p> Vous avez reçu un mail à l'adresse {{mail}} celui-ci contient un code de vérification.</p>
                <div class="control-group">
                    <label class="control-label">Code:</label>
                    <div class="controls">
                        <input type="text" id="login" name="login">
                    </div>
                </div>
                        <input type="hidden"  name="verify" id="login">

                </div>
                <div class="controls">
                    <button type="submit" class="btn">OK</button>
                </div>
            </form>
        </div>
    </div>
</div>
</body>
</html>
