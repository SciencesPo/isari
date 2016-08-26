var peopleSchema = new Schema({
		isari_authorized_centers:[{
			organization:{type:Schema.Type.ObjectId,ref:'Organization'},
			isari_role:{
				type:String,
				enum:enums.isari_authorized_centers,
			}
		}],
		firstname:String,
		name:String,
		gender:{
			type:String,
			enum:enums.genders,
		},
		birthdate:Date,
		nationality:{
			type:String,
			enum:enums.nationalities,
		},
		ldap_uid:String,
		banner_uid:String,
		SIRH_matricule:String,
		ORCID:String,
		IDREF:String,
		SPIRE_ID:String,
		positions:[{
			position:{ 
				organization:{type:Schema.Type.ObjectId,ref:'Organization'},
				start_date:Date,
				end_date:Date,
				timepart:{type:Number,default:1},						
				function:{
					type:String,
					enum:enums.functions
				}
			},
			statuses:[{
				status:{
					type:String,
					enum:enums.statuses,
					start_date:Date,
					end_date:Date
				}
		}],
		bonuses:[
			bonus:{
				type:{//Si si, c'est le nom du champ...
					type:String,
					enum:enums.bonuses
				},
				start_date:Date,
				end_date:Date
			}
		],
		contact:{
			email:{type:String},
			phone:{type:String}
		},
		photo_filename:String,
		biography:String,
		tags:{
			hceres_2017:Array,
			hceres_2012:Array,
			methods:[{
				type:String,
				enum:enums.methods
			}],
			free:Array,
			erc:Array,
			discipline:{
				type:String,
				enum:enum.disciplines
			},
			research_theme:{
				type:String,
				enum:enums.research_themes
			}
		},
		langs:Array,
		activities:[
			activity:{type:Schema.Type.ObjectId,ref:'Activity'}
		],
		distinctions:[{
				organization:{type:Schema.Type.ObjectId,ref:'Organization'},
				date:Date,
				title:String,
				distinctionType:{
					type:String,
					enum:enums.distinctionsType
				},
				subject:String,
				honours:String,//désolé, honours est toujours au pluriel. Faut pas se laisser aller à la mauvaise aurtaugrafe non plus.
				preference:Number
		}],
		
		
		
		
})


var Organization  = mongoose.model('Organization',organizationSchema);
var Activity  = mongoose.model('Activity',activitySchema);
var People  = mongoose.model('People',peopleSchema);