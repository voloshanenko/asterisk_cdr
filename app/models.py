from sqlalchemy.inspection import inspect
from app import db

class BaseModel(db.Model):
    __abstract__ = True

    def serialize_me(self):
        return {c: getattr(self, c) for c in inspect(self).attrs.keys()}

    @staticmethod
    def serialize_list(l):
        return [m.serialize_me() for m in l]

    def serialize(self):
        d = self.serialize_me(self)
        return d

    def __getitem__(self, key):
        return getattr(self, key)

class CallsLog(BaseModel):
    __tablename__ = "cdr"
    calldate = db.Column(db.DateTime, index=True)
    clid = db.Column(db.String(80))
    src = db.Column(db.String(80))
    dst = db.Column(db.String(80), index=True)
    dcontext = db.Column(db.String(80))
    channel = db.Column(db.String(80))
    dstchannel = db.Column(db.String(80))
    lastapp = db.Column(db.String(80))
    lastdata = db.Column(db.String(80))
    duration = db.Column(db.Integer)
    billsec = db.Column(db.Integer)
    disposition = db.Column(db.String(45))
    amaflags = db.Column(db.Integer)
    accountcode = db.Column(db.String(20), index=True)
    uniqueid = db.Column(db.String(32), index=True)
    userfield = db.Column(db.String(255))
    did = db.Column(db.String(50), index=True)
    recordingfile = db.Column(db.String(255), index=True)
    cnum = db.Column(db.String(40))
    cnam = db.Column(db.String(40))
    outbound_cnum = db.Column(db.String(40))
    outbound_cnam = db.Column(db.String(40))
    dst_cnam = db.Column(db.String(40))
    linkedid = db.Column(db.String(32))
    peeraccount = db.Column(db.String(80))
    sequence = db.Column(db.Integer, primary_key=True)