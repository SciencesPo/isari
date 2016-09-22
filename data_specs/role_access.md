# role and access

Role and access are summarized in [role_access.json](role_access.json) file.  
To defined which data attributes are tagged as specific access rules, we use the [global_meta.json](global_meta.json) file.

# roles 

## default roles

**Research member**:  
Should be attributed to people who has an academic affiliation to a Sciences Po research center.
It's specific to 'people'-'research center' couples.
It can be manually set by Central admin.

**Public internal**:  
Default role of people who have an account in ISARI but trying to watch a different research center to the one they are affiliated to.
It's specific to 'people'-'research center' couples.

**Public external**:  
Default role for people who are not logged in.

## specific roles

**Central admin**  
The Scientific Direction staff membre who can monitor and contribute to ISARI from central point of view.

**Central reader**  
Executive Direction staff member who can monitor the complete scope of ISARI from a central point of view.

**Research admin**  
Executive Direction staff members of one specific research unit who can monitor and contribute to ISARI about one research unit perimiter.
It's specific to 'people'-'research center' couples.

**Research editor**  
Administrative staff members of one specific research unit who can contribute to ISARI about one research unit perimiter.
It's specific to 'people'-'research center' couples.
	
# access 

## default rules

**No public access**
So far we don't provide a specific view on objects for a public access (neither internal nor external).

**Research unit isolation**  
Access Research unit information are isolated to research specific roles.
Inside one research unit by default everyone can write any information.

**Curriculum Vitae isolation**  
Curriculum Vitae (i.e. people data model) can be read by all research unit members.
Only the admins (local or global) and the Curriculum Vitae author can write.

**Central point of view**  
The research unit isolation has tow exceptions in the Central roles:

- Central admin: can write any data in Isari
- Central reader: can read any data in Isari 

## specific rules

Exceptions to the default rule are specified in the specific rules.

**confidential**  
A few set of data attrbutes are tagged as **confidential**.
In such cases:

- Central Admin : can write (and thus read)
- Central Reader : can read
- Resarch Admin : can read

**corporate**  
A part of researchers' Curriculum Vitae are tagged as corporate.
In such case:

- Central Admin : can write (and thus read)
- Central Reader : can read
- Resarch Admin : can read
- Research editor : can read
- research member : can read even others' CV but can't write even in their own CV

**individual**  
Individual information are part of researchers' Curriculum Vitae which are not tagged as corporate.  
Those attributes are specifically tagged as "individual".  
In such case:

- Central Admin : can write (and thus read)
- Central Reader : can read
- Resarch Admin : can write (and thus read)
- Research editor : can write (and thus read)
- research member : can write their own CV and can read others' CV  



