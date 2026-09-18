import fs from 'fs';
import path from 'path';

const PROJECT_ID = 'data-library-5cf6c';
const BASE_URL = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;

class FirestoreApiClient {
  constructor() {
    this.toolsConfigPath = path.join(process.env.USERPROFILE, '.config', 'configstore', 'firebase-tools.json');
    this.clientId = '563584335869-fgrhgmd47bqnekij5i8b5pr03ho849e6.apps.googleusercontent.com';
    this.accessToken = null;
    this.refreshToken = null;
  }

  loadConfig() {
    if (!fs.existsSync(this.toolsConfigPath)) {
      throw new Error(`Firebase tools configuration not found at ${this.toolsConfigPath}. Please run 'npx firebase login'.`);
    }
    const config = JSON.parse(fs.readFileSync(this.toolsConfigPath, 'utf8'));
    this.accessToken = config.tokens?.access_token || null;
    this.refreshToken = config.tokens?.refresh_token || null;
  }

  async getAccessToken() {
    if (!this.refreshToken) {
      this.loadConfig();
    }

    // Try current token
    if (this.accessToken) {
      const testRes = await fetch(`${BASE_URL}/categories?pageSize=1`, {
        headers: { Authorization: `Bearer ${this.accessToken}` }
      });
      if (testRes.status === 200) {
        return this.accessToken;
      }
    }

    // Refresh token
    const res = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: this.clientId,
        refresh_token: this.refreshToken,
        grant_type: 'refresh_token'
      })
    });

    const data = await res.json();
    if (!data.access_token) {
      throw new Error(`Failed to refresh Google OAuth token: ${JSON.stringify(data)}`);
    }

    this.accessToken = data.access_token;
    return this.accessToken;
  }

  parseFields(fields) {
    if (!fields) return {};
    const obj = {};
    for (const [k, v] of Object.entries(fields)) {
      if (v.stringValue !== undefined) obj[k] = v.stringValue;
      else if (v.integerValue !== undefined) obj[k] = parseInt(v.integerValue, 10);
      else if (v.doubleValue !== undefined) obj[k] = parseFloat(v.doubleValue);
      else if (v.booleanValue !== undefined) obj[k] = v.booleanValue;
      else if (v.timestampValue !== undefined) obj[k] = v.timestampValue;
      else if (v.arrayValue !== undefined) {
        obj[k] = (v.arrayValue.values || []).map(val => {
          if (val.mapValue) return this.parseFields(val.mapValue.fields);
          return Object.values(val)[0];
        });
      } else if (v.mapValue !== undefined) {
        obj[k] = this.parseFields(v.mapValue.fields);
      } else {
        obj[k] = null;
      }
    }
    return obj;
  }

  encodeFields(obj) {
    const fields = {};
    for (const [k, v] of Object.entries(obj)) {
      if (v === undefined) continue;
      if (v === null) {
        fields[k] = { nullValue: null };
      } else if (typeof v === 'string') {
        fields[k] = { stringValue: v };
      } else if (typeof v === 'boolean') {
        fields[k] = { booleanValue: v };
      } else if (typeof v === 'number') {
        if (Number.isInteger(v)) {
          fields[k] = { integerValue: v.toString() };
        } else {
          fields[k] = { doubleValue: v };
        }
      } else if (v instanceof Date) {
        fields[k] = { timestampValue: v.toISOString() };
      } else if (Array.isArray(v)) {
        fields[k] = {
          arrayValue: {
            values: v.map(item => {
              if (typeof item === 'string') return { stringValue: item };
              if (typeof item === 'number') return { integerValue: item.toString() };
              if (typeof item === 'object' && item !== null) return { mapValue: { fields: this.encodeFields(item) } };
              return { stringValue: String(item) };
            })
          }
        };
      } else if (typeof v === 'object') {
        fields[k] = { mapValue: { fields: this.encodeFields(v) } };
      }
    }
    return fields;
  }

  async getDocuments(collectionName) {
    const token = await this.getAccessToken();
    let docs = [];
    let pageToken = '';
    do {
      const url = `${BASE_URL}/${collectionName}?pageSize=300${pageToken ? '&pageToken=' + pageToken : ''}`;
      const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Fetch ${collectionName} failed (${res.status}): ${errText}`);
      }
      const data = await res.json();
      if (data.documents) {
        for (const d of data.documents) {
          const id = d.name.split('/').pop();
          docs.push({ id, ...this.parseFields(d.fields) });
        }
      }
      pageToken = data.nextPageToken || '';
    } while (pageToken);
    return docs;
  }

  async getDocument(collectionName, docId) {
    const token = await this.getAccessToken();
    const url = `${BASE_URL}/${collectionName}/${encodeURIComponent(docId)}`;
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    if (res.status === 404) return null;
    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Get doc ${collectionName}/${docId} failed (${res.status}): ${errText}`);
    }
    const d = await res.json();
    return { id: docId, ...this.parseFields(d.fields) };
  }

  async createDocument(collectionName, docId, data) {
    const token = await this.getAccessToken();
    const fields = this.encodeFields({
      ...data,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    let url;
    let method = 'POST';
    if (docId) {
      url = `${BASE_URL}/${collectionName}?documentId=${encodeURIComponent(docId)}`;
    } else {
      url = `${BASE_URL}/${collectionName}`;
    }

    const res = await fetch(url, {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ fields })
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Create doc in ${collectionName} failed (${res.status}): ${errText}`);
    }
    const created = await res.json();
    const id = created.name.split('/').pop();
    return { id, ...this.parseFields(created.fields) };
  }

  async updateDocument(collectionName, docId, updates) {
    const token = await this.getAccessToken();
    const dataWithTs = {
      ...updates,
      updatedAt: new Date()
    };
    const fields = this.encodeFields(dataWithTs);
    const updateMaskKeys = Object.keys(dataWithTs);
    const maskParams = updateMaskKeys.map(k => `updateMask.fieldPaths=${encodeURIComponent(k)}`).join('&');
    const url = `${BASE_URL}/${collectionName}/${encodeURIComponent(docId)}?${maskParams}`;

    const res = await fetch(url, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ fields })
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Update doc ${collectionName}/${docId} failed (${res.status}): ${errText}`);
    }
    const updated = await res.json();
    return { id: docId, ...this.parseFields(updated.fields) };
  }

  async softDeleteDocument(collectionName, docId) {
    return this.updateDocument(collectionName, docId, {
      isDeleted: true,
      deletedAt: new Date().toISOString()
    });
  }
}

export const firestoreApi = new FirestoreApiClient();
