
import socket
import os
import webbrowser
import subprocess
from wsgiref import simple_server
import requests
import sys
import argparse
import threading
import multiprocessing
from urllib.parse import parse_qs
try:
    from urllib import urlencode
except ImportError:
    from urllib.parse import urlencode

AUTHZ_URL = 'https://orkapplicationurl'
AUTHN_URL = 'https://vouchurl/login'
WEB_PORTS = [12345, 23456]
TEST_PAYLOAD = 'ORKTESTORKTEST'
TEST_PARAM_NAME = 'healthcheck'
SERVER_URL = 'http://localhost.ork.io:%i/' #used for callback
HOST = 'localhost.ork.io' #host to be added to host file for callback, must match SERVER_URL

class Hostfile:
    def _get_host_file_lines(self):
        with open('/etc/hosts', 'r') as input:
            lines = input.readlines()
            return lines
    
    def add(self, hostname):
        added = False
        skip = False
        lines = self._get_host_file_lines()
        ip = '127.0.0.1'

        with open('/etc/hosts', 'w') as output:
            for line in lines:
                if line.startswith('#') or line == '\n':
                    output.write(line.strip()+ '\n')
                else:
                    segment = line.split()
                    if ip == segment[0] and hostname in line:
                        skip = True
                    
                    if ip == segment[0] and not added and not skip:
                        segment.append(hostname)
                        added = True
                        print('Adding %s to hosts file' % hostname)
                    output.write(segment[0])
                    output.write('\t')
                    output.write(' '.join(segment[1:]))
                    output.write('\n')
            if not added and not skip:
                output.write(ip)
                output.write('\t')
                output.write(hostname)
                output.write('\n')
            return not skip

class VouchClient:
    def get_server(self, app):
        for port in WEB_PORTS:
            try:
                server = simple_server.make_server('0.0.0.0', port, app)
                return server
            except socket.error:
                # This port did not work. Switch to next one
                continue

    def _test_server(self, server):  
        if not server:
            raise Exception('We were unable to instantiate a webserver')
        server.timeout = 1
        server_thread = threading.Thread(target=server.handle_request)
        server_thread.start()
        try:
            test_resp = requests.get(
                SERVER_URL % server.socket.getsockname()[1],
                params = {TEST_PARAM_NAME: TEST_PAYLOAD})
            test_resp.raise_for_status()
            assert self._domain_working is True, 'Localhost domain check unexpected state'
        except Exception:
            try:
                added = Hostfile().add(HOST)
                if not added:
                    raise Exception('Domain already in hostfile but resolution doesnt work')
            except OSError:
                print('\033[93mRestart application as sudo to setup hosts file!\033[0m')
                return False
        server_thread.join()

    def _test_domain_response(self, query, start_response):
        if TEST_PAYLOAD in query:
            self._domain_working = True
            start_response('200 OK', [('Content-Type', 'text/plain')])
            return [u'Test successful'.encode('ascii')]
        else:
            start_response('404 Not Found', [('Content-Type', 'text/plain')])
            return [u'Test unsuccessful'.encode('ascii')]

    def get_new_token(self, start_browser):
        self._retrieved_code = None
        self._domain_working = None
        server = None
        return_uri = None
        authn_url = None

        def _vouch_token_app(environ, start_response):
            if self._domain_working == None:
                return self._test_domain_response(environ['QUERY_STRING'], start_response)

            cookie_header = environ.get('HTTP_COOKIE')
            cookies = cookie_header.split(';')
            vouch_cookie = None
            for c in cookies:
                if 'VouchCookie' in c:
                    vouch_cookie = c

            if vouch_cookie == None:
                self._retrieved_code = False
            else:
                self._retrieved_code = vouch_cookie.lstrip()

            # Just return a message
            start_response('200 OK', [('Content-Type', 'text/plain')])
            return [u'You can close this window and return to the CLI'.encode('ascii')]

        return_uri = None
        server = self.get_server(_vouch_token_app)
        return_uri = SERVER_URL % server.socket.getsockname()[1]
        self._test_server(server)
        rquery = {}
        rquery['X-Vouch-Token'] = ''
        rquery['error'] = ''
        rquery['url'] = return_uri
        rquery['vouch-failcount'] = ''
        query = urlencode(rquery)
        authn_url = '%s?%s' % (AUTHN_URL, query)
        print('\033[94mPlease visit \033[4m%s\033[0m\033[94m to grant authorization\033[0m' % authn_url)
        if start_browser:
            webbrowser.open(authn_url)
        server.timeout = None
        server.handle_request()
        server.server_close()

        assert self._retrieved_code is not None, 'Could not get code from response'
        if self._retrieved_code is False:
            # The user cancelled the request
            self._retrieved_code = None
            print('User cancelled')
            return None
        return self._retrieved_code

def resolve_rolebindings(cluster):
    userrolebindings_resp = requests.get(
        AUTHZ_URL + 'api/v1/userrolebindings',
        headers = {'Cookie': vouch_cookie})
    userrolebindings_resp.raise_for_status()
    if userrolebindings_resp.status_code != 200:
        print('Error getting possible rolebindings for user: %s' % userrolebindings_resp.text)
        return None
    else:
        userrolebindings_data = userrolebindings_resp.json()
        for cluster_data in userrolebindings_data['result']['rolebindings']:
            if cluster_data['cluster'] == cluster:
                merged_roles = cluster_data['roles'] + cluster_data['clusterRoles']
                while True:
                    print('Rolebinding options:\n %s' % merged_roles)
                    rolebinding = input('Select a rolebinding to request:')
                    if rolebinding in merged_roles:
                        return rolebinding
                    else:
                        print('Rolebinding not in options')

def add_rolebinding(cluster, rolebinding, vouch_cookie):
    rolebinding_resp = requests.post(
        AUTHZ_URL + 'api/v1/clusters/' + cluster + '/rolebindings',
        headers = {'Cookie': vouch_cookie},
        json = {"role" : rolebinding})
    rolebinding_resp.raise_for_status()
    if rolebinding_resp.status_code != 201:
        print('Error adding rolebinding: %s' % rolebinding_resp.text)
    else:
        print('User authorized for ' + rolebinding + ' on ' + cluster)

def get_vouchcookie(start_browser, vouch_cookie):
    if vouch_cookie:
        vouch_cookie = 'VouchCookie=' + args.vouch_cookie
        return vouch_cookie
    else:
        vouch_cookie = VouchClient().get_new_token(start_browser)
        if vouch_cookie == False:
            return None
        else:
            return vouch_cookie

if __name__ == '__main__':
    try:
        k8s_envs = ['dev']
        parser = argparse.ArgumentParser()
        parser.add_argument('-b', action='store_true', dest='start_browser', help='start browser for login')
        parser.add_argument('-s', action='store_true', dest='setup', help='only setup hosts file but dont start authz flow')
        parser.add_argument('-v', dest='vouch_cookie', help='vouch cookie value to use for authentication')
        parser.add_argument('-k', dest='k8s_env', help='k8s cluster to connect to: ' + ','.join(k8s_envs))

        args = parser.parse_args()

        if args.setup:
            added = Hostfile().add(HOST)
            print('Updated hostfile: %s' % added)
        elif args.k8s_env is not None:
            assert args.k8s_env in k8s_envs, 'Kubernetes environment not recognized'
            vouch_cookie = get_vouchcookie(args.start_browser, args.vouch_cookie)
            assert vouch_cookie is not None, 'Did not succeed getting vouch cookie. Check logs!'

            rolebinding = resolve_rolebindings(args.k8s_env)
            assert rolebinding is not None, 'Could not resolve possible rolebindings'
            add_rolebinding(args.k8s_env, rolebinding, vouch_cookie)
        else:
            print('Missing parameter -k')
            sys.exit(1)
    except AssertionError as msg: 
        print(msg)
        sys.exit(1)
