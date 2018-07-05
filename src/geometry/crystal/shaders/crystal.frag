#define PHYSICAL

uniform vec3 diffuse;
uniform vec3 emissive;
uniform float roughness;
uniform float metalness;
uniform float opacity;

#pragma glslify: noise = require('glsl-noise/simplex/3d');

vec2 truchetPattern(in vec2 _st, in float _index){
    _index = fract(((_index-0.5)*2.0));
    if (_index > 0.75) {
        _st = vec2(1.0) - _st;
    } else if (_index > 0.5) {
        _st = vec2(1.0-_st.x,_st.y);
    } else if (_index > 0.25) {
        _st = 1.0-vec2(1.0-_st.x,_st.y);
    }
    return _st;
}

float random (in vec2 _st) {
    return fract(sin(dot(_st.xy,
                         vec2(12.9898,78.233)))*
        43758.5453123);
}

varying vec3 vBarycentric;
varying vec3 vTransformed;
varying vec3 vOffset;
varying float vTxValue;

varying float vTopVertex;
varying float vCenterTopVertex;

#ifndef STANDARD
	uniform float clearCoat;
	uniform float clearCoatRoughness;
#endif

varying vec3 vViewPosition;
varying float vSpentRatio;

#ifndef FLAT_SHADED

	varying vec3 vNormal;

#endif

#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <uv2_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <envmap_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <cube_uv_reflection_fragment>
#include <lights_pars_begin>
#include <lights_pars_maps>
#include <lights_physical_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <roughnessmap_pars_fragment>
#include <metalnessmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>

void main() {

	#include <clipping_planes_fragment>

	vec3 diffuseVar = diffuse;
	
	diffuseVar *= (1.0 - (vSpentRatio));

	diffuseVar += 0.2;

	vec4 diffuseColor = vec4( diffuseVar, opacity );

	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;

	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <roughnessmap_fragment>
	#include <metalnessmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>

	// accumulation
	#include <lights_physical_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>

	// modulation
	#include <aomap_fragment>

	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + reflectedLight.directSpecular + reflectedLight.indirectSpecular + totalEmissiveRadiance;


	float spentRatio = clamp(vSpentRatio, 0.5, 1.0);

	outgoingLight += (1.0 - spentRatio);
	//outgoingLight *= (1.0 - vSpentRatio);

  	float d = min(min(vBarycentric.x, vBarycentric.y), vBarycentric.z);
	//float edgeAmount = pow(clamp( (1.0 - d), 0.0, 1.0), 6.0) * 0.25 * clamp(vOffset.z * 0.15, 0.0,  1.0);
	//float edgeAmount = pow(clamp( (1.0 - d), 0.0, 1.0), 6.0) * 0.15 * clamp(vOffset.z * 0.1, 0.0,  1.0);
	float edgeAmount = pow(clamp( (1.0 - d), 0.0, 1.0), 6.0) * 0.07;
	
	float noiseAmount = noise(vec3(vTransformed.xyz * 0.03)) * noise(vec3(vTransformed.xyz * 0.005)) * 0.15;

	//float edgeNoise = edgeAmount + noiseAmount;

	outgoingLight += edgeAmount;
	outgoingLight += noiseAmount;

	outgoingLight.b += 0.2;
	outgoingLight.g += 0.1;

	float aspect = vUv.x / vUv.y;

	//vec2 st = vec2(vUv.x, vUv.y) * 25.0;
	vec2 st = vec2(vUv.x * 25.0, vTransformed.z);
    vec2 ipos = floor(st);  // integer
    vec2 fpos = fract(st);  // fraction

    vec2 tile = truchetPattern(fpos, random( ipos ));

	// Maze
	float color = 0.0;
    color = smoothstep(tile.x-0.3,tile.x,tile.y)-
            smoothstep(tile.x,tile.x+0.3,tile.y);

	// further smoothing    
    color -= smoothstep(tile.x+0.3,tile.x,0.0)-
            smoothstep(tile.x,tile.x-0.3,-0.15);
    
    color -= smoothstep(tile.y+0.3,tile.y,0.0)-
            smoothstep(tile.y,tile.y-0.3,-0.15);
    
    color -= smoothstep(tile.x+0.3,tile.x,1.15)-
            smoothstep(tile.x,tile.x-0.3,1.0);
    
	color -= smoothstep(tile.y+0.3,tile.y,1.15)-
		    smoothstep(tile.y,tile.y-0.3,1.0);

	color *= abs(noiseAmount * 4.0);

	color = clamp(color, 0.0, 1.0);

	outgoingLight += (color * (1.0-vTopVertex));


	outgoingLight *= 0.9;
	
	gl_FragColor = vec4( outgoingLight, diffuseColor.a * clamp(noiseAmount + 0.9, 0.0, 1.0) );
	//gl_FragColor = vec4( outgoingLight, diffuseColor.a);

	#include <tonemapping_fragment>
	#include <encodings_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>

}