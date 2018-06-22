/**   _   _____ _   _   
*    | | |_   _| |_| |
*    | |_ _| | |  _  |
*    |___|_|_| |_| |_|
*    @author lo.th / https://github.com/lo-th
*    AMMO CONTACT
*/

function stepContact () {

    var i = contactGroups.length;
    while( i-- ) contactGroups[i].step();

};

function clearContact () {

    while( contactGroups.length > 0) contactGroups.pop().clear();
    contactGroups = [];
    contacts = [];

};

function addContact ( o ) {

    var id = contactGroups.length;
    var c = new Contact( o, id );
    if( c.valide ){
        contactGroups.push( c );
        contacts.push(0);
    }

};

//--------------------------------------------------
//
//  CONTACT CLASS
//
//--------------------------------------------------

function Contact ( o, id ) {

    this.a = getByName( o.b1 );
    this.b = o.b2 !== undefined ? getByName( o.b2 ) : null;

    if( this.a !== null ){

        this.id = id;
        this.f = new Ammo.ConcreteContactResultCallback();
        this.f.addSingleResult = function(){ contacts[id] = 1; }
        this.valide = true;

    } else {

        this.valide = false;

    }

}

Contact.prototype = {

    step: function () {

        contacts[ this.id ] = 0;
        if( this.b !== null ) world.contactPairTest( this.a, this.b, this.f );
        else world.contactTest( this.a, this.f );

    },

    clear: function () {

        this.a = null;
        this.b = null;
        Ammo.destroy( this.f );

    }

}