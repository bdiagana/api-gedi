// imports modules nodejs
const request = require('request');
const querystring = require('querystring');
const fs = require('fs');
const express = require('express');
const app = express();
const conf = require('./load_conf');
const multer = require('multer');
const mail = require('nodemailer').createTransport({
	service: 'gmail',
	auth: {
		user: conf.mail.user,
		pass: conf.mail.pass
	}
});
const mysql = require('mysql').createConnection({
	host: conf.mysql.hostname,
	user: conf.mysql.user,
	password: conf.mysql.pass,
	port: conf.mysql.port,
	database: conf.mysql.db,
	charset: 'utf8'
});
const session = require('express-session');
const logger = require('morgan');


//variable de session dms
var admin_session;

// used to queue files to upload
var files_to_upload;
var id_document_attach;

var upload = multer({ dest: 'uploads/' })

// middleware
app.use(logger('dev'))
app.use(express.urlencoded());
app.use(express.json());
app.use(express.static(__dirname + '/public'));
app.use(session({
	secret: 'apigeditwothousandnineteen',
	resave: false,
	saveUninitialized: true,
	cookie: { secure: false }
}));

// paramétrage moteur de template
app.set('view engine', 'ejs')

// get routes
app.get('/',(req,res) => {
	req.session.offre = req.query.offre;
	res.redirect('/signin');
});

app.get('/disconnect',(req,res)=>{
	if (req.session.dms_session) {
		req.session.dms_session = undefined
		req.session.success = "Déconnecté !"
	}
	res.redirect("/signin");
});

app.get('/signin', (req, res) => {
	if (req.session.dms_session) res.redirect("/offre");
	else {
		if (req.session.success !== undefined) {
			res.locals.success = req.session.success;
			req.session.success = undefined;
		}
		if (req.session.error !== undefined) {
			res.locals.error = req.session.error;
			req.session.error = undefined;
		}

		res.render('form_login');
	}
});

app.get('/signup', (req, res) => {
	if (req.session.dms_session) res.redirect("/offre");
	else res.render('form_creation')
});

app.get('/offre', (req, res) => {

	if (req.session.dms_session) {
		if (req.session.user) res.locals.username = req.session.user;

		const { moins5k, entre5ket25k, entre25ket90k, plusde90k } = conf.workflow ;

		var data = {
			moins5k: moins5k,
			entre5ket25k: entre5ket25k,
			entre25ket90k: entre25ket90k,
			plusde90k: plusde90k
		}

		res.render('form_offre', data);
	}
	else {
		req.session.error = "Veuillez vous connecter";
		res.redirect("/signin");
	}
});

app.get('/verify', (req, res) => {

	var query = "";
	var variable = "";

	if (req.query.mail){
		query = 'SELECT * FROM tblUsers WHERE email = ?;';
		variable = [req.query.mail];
	}
	else if (req.query.user){
		query = 'SELECT * FROM tblUsers WHERE login = ?;';
		variable = [req.query.user];
	}

	if (query && variable){
		mysql.query(query , variable,(error,results,fields) => {
			if (error) loggit(error);
			if(results.length > 0){
				res.codeStatus = 200;
				res.send('1');
			}
			else {
				res.codeStatus = 200;
				res.send('0');
			}
		});
	}
});

app.get('/prestation', (req, res) => {

	if (req.session.dms_session) {
		if (req.session.user) res.locals.user = req.session.user;
		res.render('form_presta');
	}
	else {
		req.session.error = "Veuillez vous connecter";
		res.redirect("/signin");
	}
});

app.post('/code',(req,res)=>{
	//require('./response').verify_mail(req,res);
	loggit("verif_mail");
	query = 'SELECT * FROM verif_mail WHERE mail = ? AND code = ? LIMIT 1;';
	mysql.query(query,[req.body.mail,req.body.code],(error,results,fields)=> {
		if (error) loggit(error);
		if(results.length > 0){
			update_result(results,req,res);
		}
		else {
			res.render('form_code', {mail: req.body.mail});
		}
	});
});

app.post('/signin',(req,res)=>{
	http_request('{"user":"' + req.body.user + '","pass":"' + req.body.pass + '"}',"/login","POST",user_connected,req,res);
})

app.post('/signup',(req,res)=>{
	//connection administrateur
	http_request('{"user":"' + conf.geduser.username + '","pass":"' + conf.geduser.password + '"}',"/login","POST",admin_connection,req,res);
})

app.post('/offre',upload.array('docs',12), (req,res) => {

	if (req.session.dms_session === undefined) {
		req.session.error = "Veuillez vous connecter";
		res.redirect("/signin");
		return
	}

	// if (req.files === undefined || req.files === []) {
	// 	req.session.error = "Aucun fichier envoyés";
	// 	res.redirect("/offre");
	// }

	files_to_upload = req.files;

	var query_folder = "SELECT homefolder FROM tblUsers WHERE login = ?";

	mysql.query(query_folder, [req.session.user], (error,results,fields)=>{
		if (error) loggit(error);
		var folder = results[0].homefolder;
		loggit("folder : " + folder);

		var query_test_folder = "SELECT id,parent FROM tblFolders WHERE name = ?";

		var annee = req.body.annee;

		mysql.query(query_test_folder,[annee],(error,results2,fields)=>{
			if (error) loggit(error);

			if (results2[0] === undefined || results2[0].parent != folder){
				loggit("creation du dossier année : " + annee + " pour l'utilisateur : " + req.session.user);
				var data = {
					name: annee
				};

				http_request(JSON.stringify(data),"/folder/"+folder+"/createfolder","POST",offre_folder_created,req,res,req.session.dms_session);
			}
			else {
				loggit("dossier année : " + annee + " déjà présent pour l'utilisateur : " + req.session.user);
				var id_folder = results2[0].id;
				var data = files_to_upload.shift();
				data.mpname = "MP-O1CF"
				data.filename= data.originalname
				loggit("data to send :" + JSON.stringify(data))
				var dms_session = req.session.dms_session;
				data.mpname = "MP-01CF"
				http_request(data,"/folder/"+id_folder+"/document","POST",document_uploaded,req,res,dms_session);
			}
		});
	});
})

// démarrage du serveur
app.listen(conf.app.port, () => loggit(`Example app listening on port ${conf.app.port}!`));

// callback détail compte. @deprecated
function account(chunk){
	loggit(chunk);
	mydms_session=null;
	http_request("{}","/logout","GET",disconnect);
}

// automatise les requetes
// data : json ou file à envoyer
// string_path : chemin de l'API sur lequel requeter
// string_method : méthode à utiliser GET,POST,PUT,DELETE
// cb : fonction de callback
// orig_request_handle : handle de request utilisateur
// orig_response_handle : handle de response utilisateur
// dms_session : session dms utilisateur (overwrite admin session)
function http_request(data, string_path,string_method,cb,orig_request_handle,orig_response_handle, dms_session) {

	var post_options = {
		method: string_method,
		url:  'http://' + conf.gedportal.hostname + ":" + conf.gedportal.port + '/restapi/index.php' + string_path,
		headers: {}
	};

	loggit(post_options.url)

	if (dms_session && dms_session != ""){
		post_options.headers["Cookie"] = dms_session;
		loggit('user cookie sent');
	}
	else if (admin_session && admin_session != ""){
		post_options.headers["Cookie"] = admin_session;
		loggit('admin cookie sent');
	}
	else {
		loggit('no cookie sent');
	}

	if (typeof data === 'string' || data instanceof String){
		post_options.headers["content-type"] = "application/json";
		post_options.body = data
		loggit("data de type string")
	}
	else {
		post_options.headers["content-type"] = "multipart/form-data";
		post_options.formData = {
			file: fs.createReadStream(data.path),
			name: data.mpname || data.originalname,
			origfilename: data.originalname,
			"Content-Type": data.mimetype
		}
	}

	request(post_options, (error,response,body)=>{
		if (error) loggit(error);
			if (cb) cb(body,orig_request_handle,orig_response_handle,response)
	});
}

// CALLBACKS : code à mettre dans un module

// callback connection administrateur
function admin_connection(chunk,orig_request_handle,orig_response_handle,res){
	if (res){
		var success = JSON.parse(chunk)['success'];
		if (success) {
			admin_session = res.headers['set-cookie'];

			loggit('connection admin : ' + chunk)

			loggit('ad : ' + admin_session);
			// infos supplémentaires client concaténées dans les commentaire
			//	var comment = `${orig_request_handle.body.societe}
			//	${orig_request_handle.body.adresse}
			//	${orig_request_handle.body.atelephone}`;
			var comment = "";

			// teste  présence des champs pour la concaténation
			if (orig_request_handle.body.societe) comment += orig_request_handle.body.societe + "\n";
			if (orig_request_handle.body.adresse) comment += orig_request_handle.body.adresse + "\n";
			if (orig_request_handle.body.telephone) comment += orig_request_handle.body.telephone + '\n';

			// informations création de compte
			var account_informations = {
				name: orig_request_handle.body.nom + " " + orig_request_handle.body.prenom,
				pass: orig_request_handle.body.pass,
				user: orig_request_handle.body.user,
				email: orig_request_handle.body.mail,
				theme: 'bootstrap',
				language: 'fr',
				comment: comment
			};

			loggit('creation');

			// requete création de compte
			http_request(JSON.stringify(account_informations),'/users','POST',account_creation,orig_request_handle,orig_response_handle);
		}
		else {
			loggit('erreur 500');
			orig_response_handle.status(500).end();
			return
		}
	}



}

// callback création de compte
function account_creation(chunk,orig_request_handle,orig_response_handle,res){
	if (JSON.parse(chunk).success) {
		loggit('creation compte : \n' + chunk);
		http_request('{"disable":"true"}',"/users/" + orig_request_handle.body.user + "/disable",'PUT',user_disabled,orig_request_handle,orig_response_handle);
	}
	else {
		resign_up(orig_request_handle,orig_response_handle);
	}
}

//callback connection
function user_connected(chunk,orig_request_handle,orig_response_handle,res){
	loggit('chunk' + chunk)
	var success = JSON.parse(chunk).success;
	if (success){
		orig_request_handle.session.dms_session = res.headers['set-cookie'];
		orig_request_handle.session.user = orig_request_handle.body.user;
		loggit(orig_request_handle.session.dms_session);
		orig_response_handle.redirect("/offre");
	}
	else {
		var infos_back = {
			user: orig_request_handle.body.user,
			pass: orig_request_handle.body.pass,
			error: "Nom d'utilisateur et/ou mot de passe incorrect !"
		};
		orig_response_handle.render("form_login", infos_back);
	}
}

function user_disabled(chunk,orig_request_handle,orig_response_handle,res){
	var success = JSON.parse(chunk).success;
	if (res){
		if(success){

			var code_verif = require('hat')();

			mysql.query('INSERT INTO verif_mail (`id`,`mail`,`code`,`verified`) VALUES (?,?,?,?);',[orig_request_handle.body.user,orig_request_handle.body.mail,code_verif,false],(error,results,fields)=>{
				if (error) loggit(error);
				loggit("Insertion reussie")
			});

			var mailOptions = {
				from: conf.mail.user,
				to: orig_request_handle.body.mail,
				subject: 'Votre code d\'activation pour GEDi',
				text: 'Voici le code à entrer : ' + code_verif
			};

			mail.sendMail(mailOptions, function(error, info){
				if (error) {
					loggit(error);
				} else {
					loggit('Email sent: ' + info.response);
				}
			});
			orig_response_handle.render("./form_code", {mail: orig_request_handle.body.mail});
		}
		else {
			loggit('user not disabled' + chunk)
			resign_up(orig_request_handle,orig_response_handle)
		}
	}
}

function disconnect(chunk){
	loggit('admin disconnected : ' + chunk);
}

function update_result(results,req,res){
	var user = results[0].id;
	loggit(user + " activated with : " + req.body.code);
	mysql.query('UPDATE verif_mail SET verified = true WHERE code = ?;', [req.body.code],(error,results,fields)=> {
		if (error) loggit(error);
		loggit(JSON.stringify(results));
		http_request('{"disable": "false"}',"/users/"+user+"/disable",'PUT',user_reactivated,req,res);
	});
}

function user_reactivated(chunk,orig_request_handle,orig_response_handle){
	if (JSON.parse(chunk).success){
		var name = JSON.parse(chunk).data.login;
		var data = {
			name: name
		};

		http_request(JSON.stringify(data),"/folder/22/createfolder","POST",folder_created,orig_request_handle,orig_response_handle);
	}
	else {
		loggit("failed user reactivate : " + chunk);
		resign_up(orig_request_handle,orig_response_handle)
	}
}

function folder_created(chunk,orig_request_handle,orig_response_handle,res){
	if (JSON.parse(chunk).success){
		loggit("folder successfuly created : " +  chunk)
		var user = JSON.parse(chunk).data.name;
		var id = JSON.parse(chunk).data.id;
		mysql.query("UPDATE tblUsers SET homefolder = ? WHERE login = ?",[id,user],(error,results,fields) =>{
			if (error) loggit(error);
			loggit(results);

			var data = {
				id: user,
				mode: 3
			};

			http_request(JSON.stringify(data),"/folder/"+id+"/access/user/add","PUT",folder_access_granted,orig_request_handle,orig_response_handle);
		});
	}
	else {
		loggit("failed folder creation : " + chunk);
		resign_up(orig_request_handle,orig_response_handle)
	}
}

function offre_folder_created(chunk,orig_request_handle,orig_response_handle,res){
	loggit(chunk)
	if (JSON.parse(chunk).success){
		var id_folder = JSON.parse(chunk).data.id;
		var data = files_to_upload.shift();
		loggit("document à upload" + JSON.stringify(data))
		var dms_session = orig_request_handle.session.dms_session;
		data.mpname = "MP-01CF"
		http_request(data,"/folder/"+id_folder+"/document","POST",document_uploaded,orig_request_handle,orig_response_handle,dms_session);
	}
	else {
		loggit("erreur lors de la création du folder : " + chunk)
	}
}

function folder_access_granted(chunk,orig_request_handle,orig_response_handle,res){
	if (JSON.parse(chunk).success){
		var user = JSON.parse(chunk).message;
		mysql.query("SELECT id FROM tblUsers WHERE login = ?", [user],(error,results,fields)=>{
			if (error) loggit(error);
			var id = results[0].id;
			mysql.query("UPDATE tblFolders SET owner = ? WHERE name = ?",[id,user],(error,results,fields)=>{
				if (error) loggit(error);
				loggit("account created successfully")
				orig_response_handle.redirect("/signin");
			});
		});
	}
	else {
		loggit("failed access grant : " + chunk);
		resign_up(orig_request_handle,orig_response_handle);
	}
}

function document_uploaded(chunk,orig_request_handle,orig_response_handle,res){
	loggit("chunked : " + chunk)
	var dms_session = orig_request_handle.session.dms_session;
	if (JSON.parse(chunk).success){
		if (files_to_upload.length > 0){
			if(JSON.parse(chunk).data.id && JSON.parse(chunk).data.id != "") {
				id_document_attach = JSON.parse(chunk).data.id;
				loggit("id document : " + id_document_attach)
			}
			var data = files_to_upload.shift();
			http_request(data,"/document/"+id_document_attach+"/attachment","POST",document_uploaded,orig_request_handle,orig_response_handle,dms_session)
		}
		else {
			//http_request('{"user":"' + conf.geduser.username + '","pass":"' + conf.geduser.password + '"}',"/login","POST",admin_co_workflow,orig_request_handle,orig_response_handle
			orig_response_handle.render('form_success',{url: "http://" + conf.address.hostname + ":" + conf.gedportal.port});
		}
	}
	else loggit("fail to attach or upload file"+ chunk)
}

function workflow_setted(chunk,orig_request_handle,orig_response_handle,res){
	if (JSON.parse(chunk).success){
		orig_response_handle.render('form_success',{url: "http://" + conf.address.hostname + ":" + conf.gedportal.port});
	}
	else {
		loggit("ça na pas marche")
	}
}

function admin_co_workflow(chunk,orig_request_handle,orig_response_handle,res){
	if (JSON.parse(chunk).success){
		admin_session = res.headers['set-cookie'];
		var data = {
			workflow: orig_request_handle.body.workflow
		};
		http_request(JSON.stringify(data),"/document/"+id_document_attach+"/workflow","POST",workflow_setted,orig_request_handle,orig_response_handle)
	}
	else{

	}
}

function resign_up(orig_request_handle,orig_response_handle){
	var infos_back = {
		nom: orig_request_handle.body.nom,
		prenom: orig_request_handle.body.prenom,
		societe: orig_request_handle.body.societe,
		adresse: orig_request_handle.body.adresse,
		telephone: orig_request_handle.body.telephone,
		mail: orig_request_handle.body.mail,
		user: orig_request_handle.body.user,
		pass: orig_request_handle.body.pass,
		passconf: orig_request_handle.body.passconf,
		error: 'Echec lors de la création du compte !'
	};

	orig_response_handle.render("form_creation", infos_back);
	loggit('triste')
}

module.exports = app;

function loggit(msg){
	if (process.env.NODE_ENV != 'test') console.log(msg);
}
