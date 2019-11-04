from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_login import LoginManager
from flask_wtf.csrf import CSRFProtect

import json, logging, os, pprint
from logging.handlers import SMTPHandler


## setup logging
logging.basicConfig(
    filename=os.environ['DISA_FL__LOGFILE_PATH'],
    level=logging.DEBUG,
    format='[%(asctime)s] %(levelname)s [%(module)s-%(funcName)s()::%(lineno)d] %(message)s',
    datefmt='%d/%b/%Y %H:%M:%S'
    )
log = logging.getLogger( __name__ )
log.info( '__init__.py logging working' )


app = Flask(__name__)

## config
app.config.from_object(os.environ['APP_SETTINGS'])
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

app.config['MAIL_SERVER'] = os.environ['DISA_FL__MAIL_SERVER']
app.config['MAIL_PORT'] = int( os.environ['DISA_FL__MAIL_PORT'] )
app.config['MAIL_USE_TLS'] = 1
app.config['MAIL_USERNAME'] = None
app.config['MAIL_PASSWORD'] = None
app.config['ADMINS'] = json.loads( os.environ.get('DISA_FL__MAIL_ADMINS_JSON') )
log.debug( f'app.config, ```{pprint.pformat(app.config)}```' )

## enable email-on-error (credit: <https://blog.miguelgrinberg.com/post/the-flask-mega-tutorial-part-vii-error-handling>)
if app.config['MAIL_SERVER']:
    # log.debug( 'hereA' )
    auth = None
    if app.config['MAIL_USERNAME'] or app.config['MAIL_PASSWORD']:
        auth = (app.config['MAIL_USERNAME'], app.config['MAIL_PASSWORD'])
    secure = None
    if app.config['MAIL_USE_TLS']:
        secure = ()
    mail_handler = SMTPHandler(
        mailhost=(app.config['MAIL_SERVER'], app.config['MAIL_PORT']),
        fromaddr='no-reply@' + app.config['MAIL_SERVER'],
        toaddrs=app.config['ADMINS'], subject='DISA web-app error',
        credentials=auth, secure=secure)
    mail_handler.setLevel( logging.ERROR )
    app.logger.addHandler(mail_handler)

db = SQLAlchemy(app)
migrate = Migrate(app, db)
csrf = CSRFProtect(app)
login = LoginManager(app)
login.login_view = 'login'

from app import routes, models

# CLI
from app.etl import teardown, setup, mongo, users, inferencing
from app.etl import denormalize, convert_citation_types
import click

@app.cli.command()
@click.option('--tables','-t', multiple=True)
def empty_tables(tables=[]):
    teardown.clear_data(tables)

@app.cli.command()
def seed():
    setup.load_multivalued_attributes()
    setup.load_many_to_many()

@app.cli.command()
@click.argument('datafile')
def mongo_migration(datafile):
    mongo.load_data(datafile)

@app.cli.command()
def rebuild():
    teardown.clear_data()
    users.add_users('data/disa_users.json')
    setup.load_multivalued_attributes()
    setup.load_many_to_one()
    setup.load_many_to_many()
    setup.load_many_to_many_with_attr()
    setup.load_role_relationships()
    mongo.load_data(os.path.join(
        app.config['APP_DIR'], 'data/mongo/entries_01_31.json') )
    inferencing.extract_information()

@app.cli.command()
def browse_data():
    with open('app/static/data/denormalized.json','w') as f:
        data = denormalize.json_for_browse()
        json.dump(data, f)

@app.cli.command()
def convert_citations():
    convert_citation_types.convert(
        os.path.join(app.config['APP_DIR'], 'data') )

# END CLI

# TEMPLATES
@app.template_filter('century')
def get_century_from_year(yearInt):
	return yearInt // 100

@app.template_filter('decade')
def get_decade_from_year(yearInt):
	return yearInt % 100 // 10

@app.template_filter('year')
def get_year_from_datetime(yearInt):
	return yearInt % 10
