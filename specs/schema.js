var fs = require('fs');
var mongoose = require('mongoose');
var enums = require('./schema.enums.json');


exports.peopleSchema = new mongoose.Schema({
	isariAuthorizedCenters: [{
		organization: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization' },
		isariRole: {
			type: String,
			enum: enums.isariRoles,
		 }
	 }],
	firstname: String,
	name: {
		type: String,
		required: true
	},
	birthname: {
		type: String,
		required: true
	},
	gender: {
		type: String,
		enum: enums.genders
	 },
		birthdate: Date,
		nationalities: [{
			type: String,
			enum: enums.nationalities,
		 }],
	ldapUid: String,
	bannerUid: String,
	sirhMatricule: String,
	spireID: String,
	positions: [{
			organization: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization' },
			startDate: Date,
			endDate: Date,
			timepart: { type: Number, default: 1 , min:0.05, max:1 },
			jobName: String,
			jobType: {
				type: String,
				enum: enums.jobType
			 },
			jobTitle: {
				type: String,
				enum: enums.jobTitle
			 },
			UG: String,
			gradesAdmin: [{
					grade: {
						type: String,
						enum: enums.gradeAdmin
					},
					startDate: Date,
					endDate: Date
					// validation custom à coder, dates grades contenus dans les dates de positions
					// validation custom à coder, ne peut être rempli que si jobType  in ["appui administratif","appui technique"]
			}],
			gradesAcademic: [{
					grade: {
						type: String,
						enum: enums.gradeAcademic
					},
					startDate: Date,
					endDate: Date
					// validation custom à coder, dates grades contenus dans les dates de positions
					// validation custom à coder, ne peut être rempli que si jobType not in ["appui administratif","appui technique"]
			}],
			bonuses: [{
				bonusType: {
					type: String,
					enum: enums.bonusTypes
				 },
				startDate: Date,
				endDate: Date
				// validation custom à coder , dates grades contenus dans les dates de positions
		 	}]
	 	}],
	academicMemberships: [
		{
			organization: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization' },
			startDate: Date,
			endDate: Date,
			membershipType: {
				type: String,
				enum: enums.academicMembership
			}
		}
	],
	deptMemberships: [
		{
			organization: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization' },
			startDate: Date,
			endDate: Date,
		}
	],

	ORCID: String,
	IDREF: String,
	biography: String,
	tags: {
		hceres2017: [{
			type: String,
			enum: enums.hceres2017
		 }],
		aeres2012: [{
			type: String,
			enum: enums.aneres2012
		 }],
		methods: [{
			type: String,
			enum: enums.methods
		 }],
		free: Array,
		erc: [{
			type: String,
			enum: enums.erc
		 }],
		discipline: [{
			type: String,
			enum: enums.disciplines
		 }],
		researchTheme: [{
			type: String,
			enum: enums.researchThemes
		 }],
		 sectionCnu: [{
		 	type: String,
		 	enum: enums.sectionCnu
		 }],
		 sectionCnrs: [{
		 	type: String,
		 	enum: enums.sectionCnrs
		 }]
	 },
 	personalActivities: [
 	 	{
 	 		personalActivityType: {
 	 			type: String,
 	 			enum: enums.personalActivityType,
 			    required: true
 		    },
 		    personalActivitySubtype: {
 	 			type: String
 	 			// choix guidé par une liste de valeurs qui dépend de personalActivityType
 	 		},
 	 		personnalActivityTitle: String,
 	 		startDate: Date,
 	 		endDate: Date,
 	 		role: String,
 	 		description: String,
 	 		organizations: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Organization' }],
 			peoples: [{ type: mongoose.Schema.Types.ObjectId, ref: 'People' }]
 	 	}
 	],
	distinctions: [{
		organizations: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Organization' }],
		date: Date,
		title: {
			type: String,
			required: true
		},
		countries: [{
			type: String,
			enum: enums.countries
		 }],
		distinctionType: {
			type: String,
			enum: enums.distinctionTypes
		 },
		subject: String,
		honours: String //désolé, honours est toujours au pluriel. Faut pas se laisser aller à la mauvaise aurtaugrafe non plus.
	 }],
 	contacts: [{
 		title: String,
 		email: { type: String, match:/^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/ },
 		phone: { type: String }
 	 }],
 	langs: [{
 		type: String,
 		enum: enums.iso6391
 	}],
	photoFilename: String,
});

exports.People = mongoose.model('People', exports.peopleSchema);




exports.organizationSchema = new mongoose.Schema({
	name: {
		type: String,
		required: true
	},
	researchunitCodes: [
		{
			code: String,
			startDate: Date,
			endDate: Date
		}
	],
	idBanner: String,
	idSpire: String,
	idRnsr: String, //identifiant niveau labo français
	UG: String,
	acronym: String,
	address: String,
	country: {
		type: String,
		enum: enums.countries
	 },
	status: {
		type: String,
		enum: enums.organizationStatuses
	},
	organizationType: {
		type: String,
		enum: enums.organizationTypes
	},
	url: String, // match syntax url ? allez non.
	parentOrganisations: [
		{ type: mongoose.Schema.Types.ObjectId, ref: 'Organization' }
	]
});

exports.Organization = mongoose.model('Organization', exports.organizationSchema);


exports.activitySchema = new mongoose.Schema({
	name: {
		type: String,
		required: true
	},
	activityType: {
		type: String,
		enum: enums.activityTypes,
		required: true
	},
	startDate: Date,
	endDate: Date,
	organizations: [{
		organization: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization' },
		role: {
			type: String,
			enum: enums.activityOrganizationRoles
			// est ce bien normé ?
		},
		startDate: Date,
		endDate: Date
		// validation custom à coder , dates grades contenus dans les dates de positions
	}],
	peoples: [{
		people: { type: mongoose.Schema.Types.ObjectId, ref: 'People' },
		role:  String,
		startDate: Date,
		endDate: Date
		// validation custom à coder , dates grades contenus dans les dates de positions
	}],
	subject: String,
	summary: String,
	url: String,
	tags: {
		hceres2017: [{
			type: String,
			enum: enums.hceres2017
		 }],
		aeres2012: [{
			type: String,
			enum: enums.aneres2012
		 }],
		methods: [{
			type: String,
			enum: enums.methods
		 }],
		free: Array,
		erc: [{
			type: String,
			enum: enums.erc
		 }],
		discipline: [{
			type: String,
			enum: enums.disciplines
		 }],
		researchTheme: [{
			type: String,
			enum: enums.researchThemes
		 }]
	},
	grants: [
		{
			organization: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization' },
			name: String,
			grantType: {
				type: String,
				enum: enums.grantTypes
			},
			grantIdentifier: String,
			sciencespoAmount: Number,
			totalAmount: Number,
			investAmount: Number,
			runAmount: Number,
			hrAmount: Number,
			currencyAmount: {
				type: String,
				enum: enums.iso4217
			},
			submissionDate: Date,
			startDate: Date,
			endDate: Date,
			UG: String,
			status: {
				type: String,
				enum: enums.grantStatuses
			}
		}
	],
	distinctions: [{
		organizations: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Organization' }],
		date: Date,
		title: {
			type: String,
			required: true
		},
		subject: String,
		honours: String //désolé, honours est toujours au pluriel. Faut pas se laisser aller à la mauvaise aurtaugrafe non plus.
	 }]
});

exports.Activity  = mongoose.model('Activity', exports.activitySchema);
