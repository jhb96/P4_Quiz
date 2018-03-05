const model = require('./model');
const {log, biglog, errorlog, colorize} = require("./out");


exports.helpCmd = rl => {
		log("Comandos:");
		log("	h|help - Muestra esta ayuda.");
		log("	list - Listar los quizzes existentes.");
		log("	show <id> - Muestra la pregunta y la respuesta del quiz indicado.");
		log("	add - Añadir un nuevo quiz interactivamente.");
		log("	delete <id> - Borrar el quiz indicado.");
		log("	edit <id> - Editar el quiz indicado.");
		log("	test <id> - Probar el quiz indicado.");
		log("	p|play - Jugar a preguntar aleatoriamente todos los quizzes.");
		log("	credits - Créditos.");
		log("	q|quit - Salir del programa.");
		rl.prompt();
};

exports.quitCmd = rl => {
	rl.close();
	rl.prompt();
};


exports.addCmd = rl => {

	rl.question(colorize(' Introduzca una pregunta: ', 'red'), question => {

		rl.question(colorize(' Introduzca la respuesta: ', 'red'), answer => {

			model.add(question,answer);
			log(`${colorize('Se ha añadido', 'magenta')}: ${question} ${colorize('=>','magenta' )} ${answer}`);
			rl.prompt();
		});
	});
};	


exports.showCmd = (rl, id) => {
	
	if (typeof id === "undefined") {
		errorlog('Falta el parametro id. ');
	} else {
		try {
			const quiz = model.getByIndex(id);
			log(` [${colorize(id, 'magenta')}]: ${quiz.question} ${colorize('=>', 'magenta')} ${quiz.answer}`);
		} catch (error) {
			errorlog(error.message);
		}
	}

	rl.prompt();
};

exports.listCmd = rl => {

	model.getAll().forEach((quiz, id) => {

		log(`[${colorize(id, 'magenta')}]: ${quiz.question}`);
	});
		//log('Listar todos los quizzes existentes.', 'red');
		rl.prompt();
};

exports.deleteCmd = (rl, id) => {
		if (typeof id === "undefined") {
		errorlog('Falta el parametro id. ');
	} else {
		try {
			model.deleteByIndex(id);
		} catch (error) {
			errorlog(error.message);
		}
	}
		rl.prompt();
};



exports.testCmd = (rl, id) => {

	if (typeof id === "undefined") {
	 	errorlog(`Falta el parametro id. `);
		rl.prompt();
	} 

	else {
		try{
			const quiz = model.getByIndex(id);
			log(` [${colorize(id, 'magenta')}]: ${quiz.question}`);
			rl.question(colorize('Introduzca una respuesta: ', 'red'), respuesta =>{

				if(String(respuesta.trim().toLowerCase()) === String(quiz.answer.toLowerCase())){
					log('Su respuesta es correcta: ');
					biglog('Correcta','green');
				}	
				else{
					log('Su respuesta es incorrecta: ');
					biglog('Incorrecta', 'red');
				}
				rl.prompt();
			});

		} catch (error) {
			errorlog(error.message);
			rl.prompt();
		}
	}
};
 


exports.editCmd = (rl, id) => {
	if (typeof id === "undefined") {
	 	errorlog(`Falta el parametro id. `);
		rl.prompt();
	} else {
		try {

			const quiz = model.getByIndex(id);

			process.stdout.isTTY && setTimeout(() => {rl.write(quiz.question)},0);

			rl.question(colorize(' Introduzca una pregunta: ', 'red'), question =>{

				process.stdout.isTTY && setTimeout(() => {rl.write(quiz.answer)},0);

				rl.question(colorize(' Introduzca la respuesta: ', 'red'), answer =>{

					model.update(id, question, answer);
					log(` Se ha cambiado el quiz ${colorize(id, 'magenta')} por: ${question} ${colorize('=>', 'magenta')} ${answer}`);
					rl.prompt();
			});
		});
		
		} catch (error) {
			errorlog(error.message);
			rl.prompt();
		}
	}

	
};

exports.creditsCmd = rl => { 
		log('Juan José Herrero Bermejo');
		rl.prompt();
	
};

exports.playCmd = rl => {

	let score = 0; //variable que guarda la puntuación

	let toBeResolved = []; //Array con índices de las preguntas que existen
	
	for (var i = 0; i < model.count(); i++){
		//toBeResolved[i] = model.getByIndex[i];
		toBeResolved[i] = i;
	}	

	const playOne = () => {

		if(toBeResolved.length == 0){
			log('¡No hay más preguntas!');
			log(`Su puntuación final es... `);
			biglog(`${score}`,'red');
			log("¡¡¡ENHORABUENA!!!",'red');
			rl.prompt();

		} else {

				let pos = Math.floor(Math.random() * toBeResolved.length);
				let id = toBeResolved[pos];
				//let id = Math.round(Math.random() * toBeResolved.length);

				let quiz = model.getByIndex(id);
				toBeResolved.splice(pos, 1);

				rl.question(colorize(quiz.question + "?\n",'yellow'), respuesta => {
				if (String(respuesta.trim().toLowerCase()) === String(quiz.answer.toLowerCase())){
					score += 1;
					log("....................................................................................................");
					log("\nRespuesta correcta\n");
					if(score == 1) {	log(`Lleva ${score} acierto`);	}
					else {	log(`Lleva ${score} aciertos`);	}
					playOne(); 
				}
				else{
					log("\nRespuesta incorrecta\n");
					log("FIN DEL JUEGO","red");
					log(`Su resultado ha sido:`);
					biglog(`${score}`,'red');
					log("¡Pruebe otra vez!\n");
					rl.prompt();
				}
			});
		}
	}

	playOne();

};