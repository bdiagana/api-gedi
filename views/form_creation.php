<html lang="fr">
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link href="css/bootstrap.css" rel="stylesheet">
    <link href="css/bootstrap-responsive.css" rel="stylesheet">
    <link href="css/font-awesome.css" rel="stylesheet">
    <link href="css/bootstrap-datepicker.css" rel="stylesheet">
    <link href="css/chosen.css" rel="stylesheet">
    <link href="css/select2.min.css" rel="stylesheet">
    <link href="css/select2-bootstrap.css" rel="stylesheet">
    <link href="css/jqtree.css" rel="stylesheet">
    <link href="css/application.css" rel="stylesheet">
    <title>GEDi: Creer un compte</title>
</head>
<body class="login">
<div class="navbar navbar-inverse navbar-fixed-top">
    <div class="navbar-inner">
        <div class="container-fluid">
            <a class="brand" href="form_creation.php">GEDi</a>
        </div>
    </div>
</div>
<div class="container-fluid">
    <div class="row-fluid">
        <legend>Creer un compte</legend>
        <div class="well">
            <form class="form-horizontal" action="test.php" method="post" enctype="multipart/form-data" name="form" id="form">


                <div class="control-group">
                    <label class="control-label">Nom:</label>
                    <div class="controls"><input type="text" id="nom" name="nom">
                    </div>
                </div>

                <div class="control-group">
                    <label class="control-label">Prenom:</label>
                    <div class="controls"><input type="text" id="prenom" name="prenom">
                    </div>
                </div>

                <div class="control-group">
                    <label class="control-label">Societe:</label>
                    <div class="controls"><input type="text" id="societe" name="societe">
                    </div>
                </div>


                <div class="control-group">
                    <label class="control-label">Adresse postale:</label>
                    <div class="controls"><input type="text" id="adresse" name="adresse">
                    </div>
                </div>

                <div class="control-group">
                    <label class="control-label">Adresse mail:</label>
                    <div class="controls"><input type="text" id="mail" name="mail">
                    </div>
                </div>

                <div class="control-group">
                    <label class="control-label">Identifiant:</label>
                    <div class="controls"><input type="text" id="login" name="login">
                    </div>
                </div>
                <div class="control-group">
                    <label class="control-label">Mot de passe:</label>
                    <div class="controls"><input type="password" class="pwd form-control" rel="strengthbar0" name="pwd" id="pwd">
                    </div>
                </div>

                <div class="control-group">
                    <label class="control-label">Confirmer le mot de passe:</label>
                    <div class="controls">
                        <input type="password" id="pwdconf" name="pwdconf">
                    </div>
                </div>
            </form>
            <div class="controls">
                <button type="submit" class="btn">Creer</button>
            </div>
        </div>
</body>
</html>
