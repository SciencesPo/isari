//Short People, excellente chanson de Randy Newman (https://play.google.com/music/preview/To5bpqly4uy6xpzie42hk2qeu2a?lyrics=1&utm_source=google&utm_medium=search&utm_campaign=lyrics&pcampaignid=kp-songlyrics)
	
var peopleSchema = new Schema({ 
	isari_authorized_centers : [{ 
		organization : { type : Schema.Type.ObjectId, ref : 'Organization' }, 
		isari_role : { 
			type : String, 
			enum : enums.isari_authorized_centers, 
		 }
	 }], 
	firstname : String, 
	name : String, 
	gender : { 
		type : String, 
		enum : enums.genders, 
	 }, 
	birthdate : Date, 
	nationality : { 
		type : String, 
		enum : enums.countries.nationality, 
	 }, 
	ldap_uid : String, 
	banner_uid : String, 
	SIRH_matricule : String, 
	ORCID : String, 
	IDREF : String, 
	SPIRE_ID : String, 
	positions : [{ 
		position : {  
			organization : { type : Schema.Type.ObjectId, ref : 'Organization' }, 
			start_date : Date, 
			end_date : Date, 
			timepart : { type : Number, default : 1 }, 						
			function : { 
				type : String, 
				enum : enums.functions
			 }
		 }, 
		statuses : [{ 
			status : { 
				type : String, 
				enum : enums.statuses, 
				start_date : Date, 
				end_date : Date
			 }
	 }], 
	bonuses : [
		bonus : { 
			bonusType : { 
				type : String, 
				enum : enums.bonuses
			 }, 
			start_date : Date, 
			end_date : Date
		 }
	], 
	contact : { 
		email : { type : String }, 
		phone : { type : String }
	 }, 
	photo_filename : String, 
	biography : String, 
	tags : { 
		hceres_2017 : Array, 
		hceres_2012 : Array, 
		methods : [{ 
			type : String, 
			enum : enums.methods
		 }], 
		free : Array, 
		erc : Array, 
		discipline : { 
			type : String, 
			enum : enum.disciplines
		 }, 
		research_theme : { 
			type : String, 
			enum : enums.research_themes
		 }
	 }, 
	langs : Array, 
	activities : [
		activity : { type : Schema.Type.ObjectId, ref : 'Activity' }
	], 
	distinctions : [{
		organizations : [{ type : Schema.Type.ObjectId, ref : 'Organization' }], 
		date : Date, 
		title : String, 
		distinctionType : { 
			type : String, 
			enum : enums.distinctionTypes
		 }, 
		subject : String, 
		honours : String, //désolé, honours est toujours au pluriel. Faut pas se laisser aller à la mauvaise aurtaugrafe non plus.
		preference : Number
	 }], 
});




var organizationSchema = new Schema({ 
	name : String,
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
	url : String,
	organisation_links : {
		linkType : {
			type : String,
			organization : { type : Schema.Type.ObjectId, ref : 'Organization' }
		}
	} 
});




var activitySchema = new Schema({
	name : String,
	activityType : {
		type : String,
		enum : enums.activityTypes
	},
	start_date : Date, 
	end_date : Date,
	organizations : [{
		organization : { type : Schema.Type.ObjectId, ref : 'Organization' }, 
		role : {
			type : String,
			enum : enums.activityOrganizationRoles
		}
	}],
	people : [{
		people : { type : Schema.Type.ObjectId, ref : 'People' }, 		
		role : {
			type : String,
			enum : enums.activityPeopleRoles
		}
	}],
	subject : String,
	summary : String,
	grants : [
		{
			organization : { type : Schema.Type.ObjectId, ref : 'Organization' },
			name : String,
			grantType : {
				type : String,
				enum : enums.grantTypes
			},
			identifier : String,
			sciencespo_amount : Number,
			total_amount : Number,
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
});

var Organization  = mongoose.model('Organization', organizationSchema);
var Activity  = mongoose.model('Activity', activitySchema);
var People  = mongoose.model('People', peopleSchema);