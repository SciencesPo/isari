var peopleSchema = new Schema({ 
	corporate : {
		isari_authorized_centers : [{ 
			organization : { type : Schema.Type.ObjectId, ref : 'Organization' }, 
			isari_role : { 
				type : String, 
				enum : enums.isari_roles, 
			 }
		 }], 
		firstname : String,
		name : { 
			type : String,
			required : true
		}, 
		gender : { 
			type : String, 
			enum : enums.genders
		 }, 
	 	birthdate : Date, 
	 	nationalities : [{ 
	 		type : String, 
	 		enum : enums.countries.nationality, 
	 	 }], 
		ldap_uid : String, 
		banner_uid : String, 
		SIRH_matricule : String, 
	 	SPIRE_ID : String,
	 	positions : [{ 
	 			organization : { type : Schema.Type.ObjectId, ref : 'Organization' }, 
	 			start_date : Date, 
	 			end_date : Date, 
	 			timepart : { type : Number, default : 1 , min:0.05, max:1 },
	 			job_name : String,
	 			job_type : { 
	 				type : String, 
	 				enum : enums.job_type
	 			 }, 						
	 			job_title : { 
	 				type : String, 
	 				enum : enums.job_title
	 			 }, 
	 			grades_admin : [{
	 					grade : {
	 						type : String, 
	 						enum : enums.grade
	 					}, 
	 					start_date : Date, 
	 					end_date : Date
	 					// validation custom à coder, dates grades contenus dans les dates de positions
	 					// validation custom à coder, ne peut être rempli que si job_type  in ["appui administratif","appui technique"]
	 			}], 
	 			grades_academic : [{
	 					grade : {
	 						type : String, 
	 						enum : enums.grade
	 					}, 
	 					start_date : Date, 
	 					end_date : Date
	 					// validation custom à coder, dates grades contenus dans les dates de positions
	 					// validation custom à coder, ne peut être rempli que si job_type not in ["appui administratif","appui technique"]
	 			}], 
	 			bonuses : [{ 
	 				bonusType : { 
	 					type : String, 
	 					enum : enums.bonusTypes
	 				 }, 
	 				start_date : Date, 
	 				end_date : Date
	 				// validation custom à coder , dates grades contenus dans les dates de positions
	 		 	}]
	 	}],
		academicMembership : [
			{	
				organization : { type : Schema.Type.ObjectId, ref : 'Organization' }, 
				start_date : Date, 
				end_date : Date,
				membership_type : {
					type : String,
					enum : enums.academicMembership
				} 
			}
		], 
	},
	individual : {
		ORCID : String, 
		IDREF : String, 
		biography : String, 
		tags : { 
			hceres_2017 : [{ 
				type : String, 
				enum : enums.hceres_2017
			 }],  
			aeres_2012 : [{ 
				type : String, 
				enum : enums.aneres_2012
			 }],  
			methods : [{ 
				type : String, 
				enum : enums.methods
			 }], 
			free : Array, 
			erc : [{ 
				type : String, 
				enum : enums.erc
			 }],  
			discipline : [{ 
				type : String, 
				enum : enums.disciplines
			 }], 
			research_theme : [{ 
				type : String, 
				enum : enums.research_themes
			 }],
			 section_CNU : [{ 
			 	type : String,
			 	enum : enums.section_cnu
			 }],
			 section_CNRS : [{
			 	type : String,
			 	enum : enums.section_cnrs
			 }]
		 },
	 	personal_activities : [
	 	 	{
	 	 		personalActivityType : {
	 	 			type : String,
	 	 			enum : enums.personalActivityType,
	 			    required : true
	 		    },
	 		    personalActivitySubtype : String,
	 	 		personnalActivityTitle : {
	 	 			type : String
	 	 			// choix guidé par une liste de valuer qui dépends de personalActivityType
	 	 		},
	 	 		start_date : Date,
	 	 		end_date : Date,
	 	 		role : String,
	 	 		description : String,
	 	 		organizations : [{ type : Schema.Type.ObjectId, ref : 'Organization' }],
	 			peoples : [{ type : Schema.Type.ObjectId, ref : 'People' }]
	 	 	}
	 	 	// eneignemenet et encadrement demandent plus de champs... on les sépare ?
	 	], 
		distinctions : [{
			organizations : [{ type : Schema.Type.ObjectId, ref : 'Organization' }], 
			date : Date, 
			title : { 
				type : String,
				required : true
			}, 
			distinctionType : { 
				type : String, 
				enum : enums.distinctionTypes
			 }, 
			subject : String, 
			honours : String //désolé, honours est toujours au pluriel. Faut pas se laisser aller à la mauvaise aurtaugrafe non plus.
		 }] 
	 	contacts : [{
	 		title : String,
	 		email : { type : String, match:/^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/ }, 
	 		phone : { type : String }
	 	 }], 
	 	langs: [{
	 		type : String,
	 		enum : enums.iso6391
	 	}],
	//photo_filename : String, 
	}
});




var organizationSchema = new Schema({ 
	name : { 
		type : String,
		required : true
	},
	researchunit_codes : [
		{
			code : String,
			start_date : Date,
			end_date : Date
		}
	],
	ID_banner : String,
	ID_spire : String,
	ID_RNSR : String, //identifiant niveau labo français
	UG : String,
	acronym : String,
	address : String,
	country : { 
		type : String, 
		enum : enums.countries.en_short_name
	 }, 
	status : {
		type : String,
		enum : enums.organizationStatuses
	},
	organizationType : {
		type : String,
		enum : enums.organizationTypes
	},
	url : String, // match syntax url ? allez non.
	parent_organisations : [
		{ type : Schema.Type.ObjectId, ref : 'Organization' }
	] 
});




var activitySchema = new Schema({
	name : { 
		type : String,
		required : true
	}, 
	activityType : {
		type : String,
		enum : enums.activityTypes,
		required : true
	},
	start_date : Date, 
	end_date : Date,
	organizations : [{
		organization : { type : Schema.Type.ObjectId, ref : 'Organization' }, 
		role : {
			type : String,
			enum : enums.activityOrganizationRoles
			// est ce bien normé ? 
		},
		start_date : Date,
		end_date : Date
		// validation custom à coder , dates grades contenus dans les dates de positions
	}],
	peoples : [{
		people : { type : Schema.Type.ObjectId, ref : 'People' }, 		
		role :  String,
		start_date : Date,
		end_date : Date
		// validation custom à coder , dates grades contenus dans les dates de positions
	}],
	subject : String,
	summary : String,
	url : String,
	tags : { 
		hceres_2017 : [{ 
			type : String, 
			enum : enums.hceres_2017
		 }],  
		aeres_2012 : [{ 
			type : String, 
			enum : enums.aneres_2012
		 }],  
		methods : [{ 
			type : String, 
			enum : enums.methods
		 }], 
		free : Array, 
		erc : [{ 
			type : String, 
			enum : enums.erc
		 }],  
		discipline : [{ 
			type : String, 
			enum : enums.disciplines
		 }], 
		research_theme : [{ 
			type : String, 
			enum : enums.research_themes
		 }]
	},
	grants : [
		{
			organization : { type : Schema.Type.ObjectId, ref : 'Organization' },
			name : String,
			grantType : {
				type : String,
				enum : enums.grantTypes
			},
			grant_identifier : String,
			sciencespo_amount : Number,
			total_amount : Number,
			invest_amount: Number,
			run_amount: Number,
			hr_amount: Number,
			currency_amount : {
				type : String,
				enum : enums.iso4217 
			}
			submission_date : Date,
			start_date : Date,
			end_date : Date,
			UG : String,
			status : {
				type : String,
				enum : enums.grantStatuses
			}
		}
	],
	distinctions : [{
		organizations : [{ type : Schema.Type.ObjectId, ref : 'Organization' }], 
		date : Date, 
		title : { 
			type : String,
			required : true
		},
		subject : String, 
		honours : String //désolé, honours est toujours au pluriel. Faut pas se laisser aller à la mauvaise aurtaugrafe non plus.
	 }]
});

var Organization  = mongoose.model('Organization', organizationSchema);
var Activity  = mongoose.model('Activity', activitySchema);
var People  = mongoose.model('People', peopleSchema);