var mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/isariTest');

var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
	var kittySchema = mongoose.Schema({
	    name: String
	});
	kittySchema.methods.speak = function () {
	  var greeting = this.name
	    ? "Meow name is " + this.name
	    : "I don't have a name";
	  console.log(greeting);
	}
	var Kitten = mongoose.model('Kitten', kittySchema);
	var silence = new Kitten({ name: 'Silence' });
	console.log(silence.name); // 'Silence'
	
	
	
	
	
	
	
	
	
	
	
});